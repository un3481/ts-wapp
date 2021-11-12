/*
##########################################################################################################################
#                                                          BOT CORE                                                      #
##########################################################################################################################
*/

// Import Bot Type
import type Bot from '../index.js'

// Import Target TypeGuard
import { isWhatsappTarget } from './wapp.js'

// Import Express
import express, { Express, Request, RequestHandler } from 'express'
import basicAuth from 'express-basic-auth'
import requestIp from 'request-ip'

// Import General Modules
import axios from 'axios'
import type { AxiosResponse } from 'axios'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Action Interfaces
import type { IAPIAction, IAAPIAction, ITarget } from './types.js'

/*
##########################################################################################################################
#                                                           API CLASS                                                    #
##########################################################################################################################
*/

// API Class
export default class NetworkWapp {
  bot: Bot
  auth: string
  app: Express
  routeAddress: string
  users: Record<string, string>

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Set Authentication
    this.users = {}
  }

  /*
  ##########################################################################################################################
  #                                                          API METHODS                                                   #
  ##########################################################################################################################
  */

  // Cycle Reference
  get network() { return this }
  get wapp() { return this.bot.wapp }
  get misc() { return this.bot.misc }
  get axios() { return axios }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Set Network API
  route(p: {
    route: string,
    app: Express
  }): NetworkWapp {
    const { route, app } = p
    // Define App
    this.routeAddress = route
    this.app = app
    return this
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Request
  async req(p: {
    target: ITarget,
    data: any
  }): Promise<AxiosResponse<any>> {
    const { target, data } = p
    return axios.post(
      target.address,
      this.misc.sets.serialize(data),
      {
        auth: {
          username: target.user,
          password: target.password
        }
      }
    )
  }

  // Safe Request
  async reqs(p: {
    target: ITarget
    action: string
    data: any
  }) {
    const req = this.misc.handle.safe(this.req, this)
    return req(p)
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Add Bot Interface Action
  add(p: {
    action: string,
    do: IAPIAction
  }): boolean {
    const { action } = p
    // Check Inputs
    if (!is.function(p.do)) throw new Error('invalid argument "do"')
    if (!is.string(action)) throw new Error('invalid argument "action"')
    if (action.length === 0) throw new Error('invalid argument "action"')
    // Set Safe Action
    const dosafe = this.misc.handle.safe(p.do)
    // Set Bot Interface
    this.app.post(
      `/${this.routeAddress}/${action}/`,
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
          this.misc.sets.serialize(response)
        ))
      }
    )
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Interface Execute Bot Command
  async execute(p: {
    action: string
    do: IAAPIAction
    req: Request
  }) {
    const { action, req } = p
    try {
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '')
      await this.bot.log(`Exec(network::actions[${action}]) From(${ip})`)
      // check request
      if (!is.object(req)) throw new Error('bad request')
      // execute action
      const [data, actionError] = await p.do(req)
      // throw action error
      if (actionError) throw actionError
      // resolve with data
      return { done: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(network::actions[${action}]) Catch(${error})`)
      // reject with error
      return { done: false, error: `${error}` }
    }
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  assign() {
    // Add send-message Action
    this.network.add({
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
          log: log || 'network::send',
          quote: quote
        }
        // get referer
        const ref = isWhatsappTarget(referer) ? referer : null
        // send message
        const [sent, sendMessageError] = await this.bot.sends(p)
        // if not done prevent execution
        if (sendMessageError) throw sendMessageError
        // set default reply action
        sent.on.reply(async message => {
          const args = {
            target: ref,
            action: 'onReply',
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

    // Add get-message Action
    this.network.add({
      action: 'getMessageById',
      do: async req => {
        // check request
        if (!is.in(req, 'body', 'object')) throw new Error('bad request')
        // eslint-disable-next-line camelcase
        const { id } = req.body as { id: unknown }
        // Check Inputs
        if (!is.string(id)) throw new Error('invalid argument "id"')
        if (id.length === 0) throw new Error('invalid argument "id"')
        return this.wapp.getMessageById(id)
      }
    })

    // Add host-device Action
    this.network.add({
      action: 'getHostDevice',
      do: async req => {
        return this.wapp.getHostDevice()
      }
    })

    // Return Done
    return true
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
