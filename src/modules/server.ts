
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

  // Request
  async req(p: { target: ITarget, data: any }): Promise<AxiosResponse<any>> {
    const { target, data } = p
    return axios.post(
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

  // Safe Request
  async reqs(p: { target: ITarget, data: any }) {
    const req = handles.safe(this.req, this)
    return req(p)
  }

  // ##########################################################################################################################

  // Interface Execute Bot Command
  async execute(p: { action: string, do: IAAPIAction, req: Request }) {
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
  add(p: { app: Express, base: string, action: string, do: IAPIAction }): boolean {
    const { app, base, action } = p
    // Check Inputs
    if (!is.function(p.do)) throw new Error('invalid argument "do"')
    if (!is.string(action)) throw new Error('invalid argument "action"')
    if (action.length === 0) throw new Error('invalid argument "action"')
    // Set Safe Action
    const dosafe = handles.safe(p.do)
    // Set Bot Interface
    app.post(
      `/${base}/${action}/`,
      basicAuth({ users: this.users }),
      express.json() as RequestHandler,
      async (req, res) => {
        // Execute Functionality
        const response = await this.execute({
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

  // Setup RESTfull API
  route(p: { app: Express, base: string }): boolean {
    const { app, base } = p

    // Add send-message Action
    this.add({
      app: app,
      base: base,
      action: 'send',
      do: async req => {
        // check request
        if (!is.object(req.body)) throw new Error('bad request')
        // eslint-disable-next-line camelcase
        const { to, text, log, quote, referer } = req.body as {
          to: unknown, text: unknown, log: unknown, quote: unknown, referer: unknown
        }
        // check arguments
        if (!is.string(to)) throw new Error('invalid argument "to"')
        if (!is.string.or.null(text)) throw new Error('invalid argument "text"')
        if (!is.string.or.null(log)) throw new Error('invalid argument "log"')
        if (!is.string.or.null(quote)) throw new Error('invalid argument "quote"')
        // fix parameters
        const p = {
          to: to,
          text: text || '',
          log: log || 'remote::send',
          quote: quote
        }
        // get referer
        const ref = isTarget(referer) ? referer : null
        // send message
        const [sent, sendMessageError] = await this.wapp.sends(p)
        // if not done prevent execution
        if (sendMessageError) throw sendMessageError
        // set default reply action
        sent.on.reply(async message => {
          const args = {
            target: ref,
            action: 'on_reply',
            data: {
              id: sent.id,
              reply: message
            }
          }
          // send on-reply trigger
          const [data, onReplyError] = await this.reqs(args)
          if (onReplyError) throw onReplyError
          return data
        })
        // return message
        return sent
      }
    })

    // ##########################################################################################################################

    // Add get-message Action
    this.add({
      app: app,
      base: base,
      action: 'get_message_by_id',
      do: async req => {
        // check request
        if (!is.object.in(req, 'body')) throw new Error('bad request')
        // eslint-disable-next-line camelcase
        const { id } = req.body as { id: unknown }
        // Check Inputs
        if (!is.string(id)) throw new Error('invalid argument "id"')
        if (id.length === 0) throw new Error('invalid argument "id"')
        return this.wapp.getMessageById(id)
      }
    })

    // ##########################################################################################################################

    // Add host-device Action
    this.add({
      app: app,
      base: base,
      action: 'get_host_device',
      do: async req => {
        return this.wapp.getHostDevice()
      }
    })

    // Return Done
    return true
  }
}

// ##########################################################################################################################
