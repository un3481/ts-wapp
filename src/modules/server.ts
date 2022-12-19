
// ##########################################################################################################################

// Import Express
import express from 'express'
import type { Express, Request, RequestHandler } from 'express'
import basicAuth from 'express-basic-auth'
import requestIp from 'request-ip'

// Import Axios
import axios from 'axios'
import type { AxiosResponse } from 'axios'

// Import Misc Modules
import { is, sets, handles } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'
import type { Await } from 'ts-misc/dist/modules/types'

// Import Modules
import { isTarget } from './types'
import type { TriggerCall, ITarget, ClientLike } from './types'
import type WhatsappCore from './core'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

// Server Trigger Class
class ServerOn<
  C extends ClientLike,
  M extends Await<ReturnType<C['sendMessage']>> = Await<ReturnType<C['sendMessage']>>
> {
  server: Server<C, M>
  users: Record<string, string>
  auth: string

  // ##########################################################################################################################

  constructor (server: Server<C, M>) {
    Object.defineProperty(this, 'server',
      { get() { return server } }
    )
  }

  // ##########################################################################################################################

  // Add Bot Interface Action
  post(
    app: Express,
    base: string,
    trigger: {
      name: string,
      fun: TriggerCall<Request, unknown>
    }
  ): boolean {
    // Check Inputs
    if (!is.string(trigger.name)) throw new Error('invalid argument "name"')
    if (trigger.name.length === 0) throw new Error('invalid argument "name"')
    if (!is.function(trigger.fun)) throw new Error('invalid argument "fun"')
    // Set Safe Action
    const sfun = handles.safe(trigger.fun).async
    // Set Bot Interface
    const on = this
    app.post(
      `/${base}/${trigger.name}/`,
      basicAuth({ get users() { return on.server.users } }),
      express.json() as RequestHandler,
      async (req, res) => {
        // Execute Functionality
        const response = await this.server.run(req, {
          name: trigger.name,
          fun: sfun
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
}

// ##########################################################################################################################

// API Class
export default class Server<
  C extends ClientLike,
  M extends Await<ReturnType<C['sendMessage']>> = Await<ReturnType<C['sendMessage']>>
> {
  core: WhatsappCore<C, M>
  users: Record<string, string>
  auth: string
  on: ServerOn<C, M>

  // ##########################################################################################################################

  constructor (core: WhatsappCore<C, M>) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
    // Set Authentication
    this.users = {}
    // Set Triggers
    this.on = new ServerOn(this)
  }

  // ##########################################################################################################################

  // Request
  async req(
    target: ITarget,
    name: string,
    data: unknown
  ): Promise<SafeReturn<AxiosResponse<any>>> {
    return handles.safe(axios.post).async(
      `${target.address}/${name}`,
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

  // Run On-Request Trigger
  async run(
    req: Request,
    trigger: {
      name: string,
      fun: TriggerCall<Request, SafeReturn<unknown>>
    }
  ) {
    try {
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '')
      await console.log(`[${t()}] Exec(remote::actions[${trigger.name}]) From(${ip})`)
      // check request
      if (!is.object(req)) throw new Error('bad request')
      // execute action
      const [ok, data] = await trigger.fun(req)
      // throw action error
      if (!ok || is.error(data)) throw data
      // resolve with data
      return { ok: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      await console.error(`[${t()}] Throw(remote::actions[${trigger.name}]) Catch(${error})`)
      // reject with error
      return { ok: false, error: `${error}` }
    }
  }

  // ##########################################################################################################################

  // Setup RESTfull API
  route(app: Express, base: string): boolean {
    // Create Safe Send-Message
    const sendMessage = handles.safe(
      this.core.client.sendMessage
    ).async
    // Add send-message Action
    this.on.post(
      app,
      base,
      {
        name: 'send',
        fun: async req => {
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
          // Send message
          const [ok, sent] = await sendMessage(
            to,
            content,
            options || {}
          )
          if (!ok || is.error(sent)) throw sent
          // Get referer
          const ref = isTarget(referer) ? referer : null
          // Add On-Reply action
          if (ref) {
            this.core.on.reply(
              sent.id._serialized,
              async message => {
                // POST On-Reply back to referer
                const [ok, data] = await this.req(
                  ref,
                  'on_reply',
                  {
                    id: sent.id,
                    reply: message
                  }
                )
                if (!ok || is.error(data)) throw data
                return data
              }
            )
          }
          // return message
          return sent
        }
      }
    )

    // ##########################################################################################################################

    // Add host-device Action
    this.on.post(
      app,
      base,
      {
        name: 'get_host_device',
        fun: async req => {
          return this.core.client.info.wid
        }
      }
    )

    // Return Done
    return true
  }
}

// ##########################################################################################################################
