
// ##########################################################################################################################

// Import Express
import express from 'express'
import type { Express, Request, RequestHandler } from 'express'
import basicAuth from 'express-basic-auth'
import requestIp from 'request-ip'

// Import Misc Modules
import { is, sets, handles } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Modules
import { isTarget } from './types'
import type { TriggerCall, ClientLike } from './types'
import type WhatsappCore from './wapp'
import Remote from './remote'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

// Server Trigger Class
class ServerOn<
  C extends ClientLike
> {
  server: Server<C>
  users: Record<string, string>
  auth: string

  // ##########################################################################################################################

  constructor (server: Server<C>) {
    Object.defineProperty(this, 'server',
      { get() { return server } }
    )
  }

  // ##########################################################################################################################

  // Add HTTP GET Endpoint
  get(
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
    app.get(
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

  // ##########################################################################################################################

  // Add HTTP POST Endpoint
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
  C extends ClientLike
> {
  core: WhatsappCore<C>
  users: Record<string, string>
  auth: string
  remote: Remote
  on: ServerOn<C>

  // ##########################################################################################################################

  constructor (core: WhatsappCore<C>) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
    // Set Authentication
    this.users = {}
    // Set Remote Object
    this.remote = new Remote()
    // Set Triggers
    this.on = new ServerOn(this)
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
      console.log(`[${t()}] Exec(remote::actions[${trigger.name}]) From(${ip})`)
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
      console.error(`[${t()}] Throw(remote::actions[${trigger.name}]) Catch(${error})`)
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

    // ##########################################################################################################################

    // Add get-host-device Action
    this.on.get(
      app,
      base,
      {
        name: 'host_device',
        fun: async req => {
          return this.core.client.info.wid
        }
      }
    )

    // ##########################################################################################################################

    // Add post-message Action
    this.on.post(
      app,
      base,
      {
        name: 'message',
        fun: async req => {
          // Check request
          if (!is.object(req.body)) throw new Error('bad request')
          // Extract arguments
          const { to, content, log, options, referer } = req.body as Record<string, unknown>
          // Check arguments
          if (!is.string(to)) throw new Error('invalid argument "to"')
          if (!is.string(content)) throw new Error('invalid argument "content"')
          if (!is.string.opt(log)) throw new Error('invalid argument "log"')
          if (!is.object.opt(options)) throw new Error('invalid argument "options"')
          if (!is(isTarget).opt(referer)) throw new Error('invalid argument "referer"')
          // Send message
          const [ok, sent] = await sendMessage(
            to,
            content,
            options || {}
          )
          // Log sent message
          const ip = requestIp.getClientIp(req).replace('::ffff:', '')
          if (log) console.log(`[${t()}] Sent(${log}) From(${ip})`)
          // Check result
          if (!ok || is.error(sent)) throw sent
          // Add On-Reply action
          if (referer) {
            this.core.on.reply(
              sent.id._serialized,
              async message => {
                // POST On-Reply back to referer
                const [ok, data] = await this.remote.post(
                  referer,
                  'reply',
                  {
                    id: sent.id._serialized,
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

    // Return Done
    return true
  }
}

// ##########################################################################################################################
