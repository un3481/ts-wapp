/*
##########################################################################################################################
#                                                          BOT CORE                                                      #
##########################################################################################################################
*/

// Import Bot Type
import type Bot from '../index.js'

// Import Express
import express, { RequestHandler } from 'express'
import type * as expressCore from 'express-serve-static-core'
import basicAuth from 'express-basic-auth'
import requestIp from 'request-ip'

// Import General Modules
import axios from 'axios'
import type { AxiosResponse } from 'axios'

// Import Action Interfaces
import type { IAPIAction, IAAPIAction, ITarget } from './types.js'

/*
##########################################################################################################################
#                                                           API CLASS                                                    #
##########################################################################################################################
*/

// API Class
export default class API {
  bot: Bot
  auth: string
  app: expressCore.Express
  actions: Record<string, IAAPIAction>
  config: {
    port: number
    auth: {
      user: string
      passwd: string
    }
  }

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Interface Actions Object
    this.actions = {}
    // Set Authentication
    this.config = {
      port: null, auth: { user: null, passwd: null }
    }
    // Get Authentication from Target Object
    const getAuth = () => ({
      [this.config.auth.user]: this.config.auth.passwd
    })
    // Define App
    this.app = express()
    this.app.use(
      basicAuth({
        get users() {
          return getAuth()
        }
      })
    )
    this.app.use(express.json() as RequestHandler)
    // Set Bot Interface
    this.app.post('/bot', async (req, res) => {
      // Execute Functionality
      const response = await this.api.execute(req)
      // Send Response
      res.send(JSON.stringify(
        this.misc.sets.serialize(response)
      ))
    })
  }

  /*
  ##########################################################################################################################
  #                                                          API METHODS                                                   #
  ##########################################################################################################################
  */

  // Cycle Reference
  get api() { return this }
  get misc() { return this.bot.misc }
  get axios() { return axios }

  //##########################################################################################################################

  // Set Listen Port
  port(port: number): API {
    this.config.port = port
    return this
  }

  // Set Basic-Auth User
  user(user: string): API {
    this.config.auth.user = user
    return this
  }

  // Set Basic-Auth Password
  password(passwd: string): API {
    this.config.auth.passwd = passwd
    return this
  }

  //##########################################################################################################################

  // Request
  async req(target: ITarget, data: any): Promise<AxiosResponse<any>> {
    return axios.post(
      target.addr,
      this.misc.sets.serialize(data),
      {
        auth: {
          username: target.auth.user,
          password: target.auth.password
        }
      }
    )
  }

  // Safe Request
  async reqs(target: ITarget, data: any): Promise<[AxiosResponse<any>, Error]> {
    const req = this.misc.handle.safe(this.req, this)
    return req(target, data)
  }

  //##########################################################################################################################

  // Start Interface App
  async start() {
    try {
      // listen on port especified
      this.app.listen(this.config.port)
    // if error occurred
    } catch { return false }
    // return success
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */

  // Interface Execute Bot Command
  async execute(req: expressCore.Request) {
    let action: string
    try {
      const is = this.misc.guards.is
      // check request
      if (!is.object(req)) throw new Error('bad request')
      if (!is.object(req.body)) throw new Error('bad request')
      if (!is.in(req.body, 'action')) throw new Error('key "action" missing in request')
      if (!is.string(req.body.action)) throw new Error('key "action" must be a string')
      if (req.body.action.length === 0) throw new Error('key "action" not valid')
      if (!is.in(this.actions, req.body.action)) throw new Error('action not found')
      // update reference
      action = req.body.action
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '')
      await this.bot.log(`Exec(api::${action}) From(${ip})`)
      // execute action
      const [data, actionError] = await this.actions[action](req)
      // throw action error
      if (actionError) throw actionError
      // resolve with data
      return { done: true, data: data }
    // if error occurred
    } catch (error) {
      // log error
      if (action) await this.bot.log(`Throw(api::${action}) Catch(${error})`)
      // reject with error
      return { done: false, error: error }
    }
  }

  // Add Bot Interface Action
  add(
    name: string,
    func: IAPIAction
  ): boolean {
    const is = this.misc.guards.is
    // Check Inputs
    if (!is.function(func)) return false
    if (!is.string(name)) return false
    if (name.length === 0) return false
    this.actions[name] = this.misc.handle.safe(func)
    return true
  }
}
