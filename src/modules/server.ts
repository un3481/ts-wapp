
// ##########################################################################################################################

// Import Express
import express, { Express, Request, RequestHandler } from 'express'
import basicAuth from 'express-basic-auth'
import requestIp from 'request-ip'

// Import Axios
import axios from 'axios'
import type { AxiosResponse } from 'axios'

// Import Misc Modules
import { is, sets, handles } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Modules
import { isTarget } from './types'
import type Wapp from './wapp'
import type { IAPIAction, IAAPIAction, ITarget } from './types'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

// API Class
export default class Server {
  wapp: Wapp
  users: Record<string, string>
  auth: string

  // ##########################################################################################################################

  constructor (wapp: Wapp) {
    Object.defineProperty(this, 'wapp',
      { get() { return wapp } }
    )
    // Set Authentication
    this.users = {}
  }

  // ##########################################################################################################################

  // Run On-POST Trigger
  async runOnPOST(p: { action: string, do: IAAPIAction, req: Request }) {
    const { action, req } = p
    try {
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '')
      await console.log(`[${t()}] Exec(remote::actions[${action}]) From(${ip})`)
      // check request
      if (!is.object(req)) throw new Error('bad request')
      // execute action
      const [data, actionError] = await p.do(req)
      // throw action error
      if (actionError) throw actionError
      // resolve with data
      return { ok: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      await console.error(`[${t()}] Throw(remote::actions[${action}]) Catch(${error})`)
      // reject with error
      return { ok: false, error: `${error}` }
    }
  }

  // ##########################################################################################################################

  // Add Bot Interface Action
  post(p: { app: Express, base: string, action: string, do: IAPIAction }): boolean {
    const { app, base, action } = p
    // Check Inputs
    if (!is.string(action)) throw new Error('invalid argument "action"')
    if (action.length === 0) throw new Error('invalid argument "action"')
    if (!is.function(p.do)) throw new Error('invalid argument "do"')
    // Set Safe Action
    const dosafe = handles.safe(p.do).async
    // Set Bot Interface
    const server = this
    app.post(
      `/${base}/${action}/`,
      basicAuth({ get users() { return server.users } }),
      express.json() as RequestHandler,
      async (req, res) => {
        // Execute Functionality
        const response = await this.runOnPOST({
          action: action,
          do: dosafe,
          req: req
        })
        // Send Response
        res.send(JSON.stringify(
          sets.serialize(response)
        ))
      }
    )
    // Return done
    return true
  }

  // ##########################################################################################################################

  // Request
  async req(p: { target: ITarget, data: unknown }): Promise<SafeReturn<AxiosResponse<any>>> {
    const { target, data } = p
    return handles.safe(axios.post).async(
      target.address,
      sets.serialize(data),
      {
        auth: {
          username: target.user,
          password: target.password
        }
      }
    )
  }

  // ##########################################################################################################################

  // Setup RESTfull API
  route(p: { app: Express, base: string }): boolean {
    const { app, base } = p

    // Add send-message Action
    this.post({
      app: app,
      base: base,
      action: 'send',
      do: async req => {
        // Check request
        if (!is.object(req.body)) throw new Error('bad request')
        // Extract arguments
        const { to, content, log, options, referer } = req.body as {
          to: unknown,
          content: unknown,
          log?: unknown,
          options?: unknown,
          referer?: unknown
        }
        // Check arguments
        if (!is.string(to)) throw new Error('invalid argument "to"')
        if (!is.string(content)) throw new Error('invalid argument "content"')
        if (!is.string.or.null(log)) throw new Error('invalid argument "log"')
        if (!is.object.or.null(options)) throw new Error('invalid argument "quote"')
        // Fix parameters
        const p = {
          to: to,
          content: content,
          log: log || 'remote::send',
          options: options || {}
        }
        // Send message
        const [ok, sent] = await this.wapp.send(p)
        if (!ok || is.error(sent)) throw sent
        // Get referer
        const ref = isTarget(referer) ? referer : null
        // Add On-Reply action
        if (ref) {
          sent.on.reply(async message => {
            const args = {
              target: ref,
              action: 'on_reply',
              data: {
                id: sent.id,
                reply: message
              }
            }
            // POST On-Reply back to referer
            const [ok, data] = await this.req(args)
            if (!ok || is.error(data)) throw data
            return data
          })
        }
        // return message
        return sent
      }
    })

    // ##########################################################################################################################

    // Add host-device Action
    this.post({
      app: app,
      base: base,
      action: 'get_host_device',
      do: async req => {
        return this.wapp.client.info.wid
      }
    })

    // Return Done
    return true
  }
}

// ##########################################################################################################################
