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
  name: string
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
    name: string,
    app: Express
  }): NetworkWapp {
    const { name, app } = p
    // Define App
    this.name = name
    this.app = app
    return this
  }

  // Set Basic-Auth User
  addUser(p: {
    user: string,
    password: string
  }): NetworkWapp {
    const { user, password } = p
    this.users[user] = password
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

  // Interface Execute Bot Command
  async execute(p: {
    name: string
    action: IAAPIAction
    req: Request
  }) {
    const { name, action, req } = p
    try {
      // check request
      if (!is.object(req)) throw new Error('bad request')
      if (!is.object(req.body)) throw new Error('bad request')
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '')
      await this.bot.log(`Exec(network::${name}) From(${ip})`)
      // execute action
      const [data, actionError] = await action(req)
      // throw action error
      if (actionError) throw actionError
      // resolve with data
      return { done: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(network::${name}) Catch(${error})`)
      // reject with error
      return { done: false, error: error }
    }
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Add Bot Interface Action
  add(
    name: string,
    action: IAPIAction
  ): boolean {
    // Check Inputs
    if (!is.function(action)) return false
    if (!is.string(name)) return false
    if (name.length === 0) return false
    // Set Safe Action
    const sAction = this.misc.handle.safe(action)
    // Set Bot Interface
    this.app.post(
      `${this.name}/${name}`,
      basicAuth({ users: this.users }),
      express.json() as RequestHandler,
      async (req, res) => {
        // Execute Functionality
        const response = await this.execute({
          name: name,
          action: sAction,
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

  assign() {
    // Add send-message Action
    this.network.add('send',
      async req => {
        // check request
        if (!is.object(req.body)) throw new Error('bad request')
        // eslint-disable-next-line camelcase
        const { to, text, log, quote, referer } = req.body
        // check arguments
        if (!is.string(to)) throw new Error('key "to" not valid')
        if (!is.string.or.null(text)) throw new Error('key "text" not valid')
        if (!is.string.or.null(log)) throw new Error('key "log" not valid')
        if (!is.string.or.null(quote)) throw new Error('key "quote" not valid')
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
    )

    // Add get-message Action
    this.network.add('getMessageById',
      async req => {
        // check request
        if (!is.object(req.body)) throw new Error('bad request')
        // eslint-disable-next-line camelcase
        const { id } = req.body
        // Check Inputs
        if (!is.string(id)) throw new Error('key "id" not valid')
        if (id.length === 0) throw new Error('key "id" not valid')
        return this.wapp.getMessageById(id)
      }
    )

    // Add host-device Action
    this.network.add('getHostDevice',
      async req => {
        return this.wapp.getHostDevice()
      }
    )

    // Return Done
    return true
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
