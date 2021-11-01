/*
##########################################################################################################################
#                                                         WHATSAPP                                                       #
##########################################################################################################################
*/

// Import Venom
import Venom from 'venom-bot'
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device'

// Import Execute
import Execute from './execute.js'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'
import type * as M from 'ts-misc/dist/utils/types.js'

// Import Bot Types
import type Bot from '../../index.js'
import type {
  ISent,
  ISentTextObj
} from '../types.js'

/*
##########################################################################################################################
#                                                    MESSAGE INTERFACES                                                  #
##########################################################################################################################
*/

// Check if Is Sent Text Object
function isSentTextObj(is: M.Is, obj: unknown): obj is ISentTextObj {
  // Check Object Properties
  if (!is.object(obj)) return false
  else if (!is.in(obj, 'to')) return false
  else if (!is.object(obj.to)) return false
  else if (!is.in(obj.to, '_serialized')) return false
  else if (!is.string(obj.to._serialized)) return false
  else return true
}

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export default class Interface {
  bot: Bot
  client: Venom.Whatsapp
  me: VenomHostDevice.Me
  started: boolean
  createConfig: Venom.CreateConfig
  execute: Execute

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Nest Objects
    this.execute = new Execute(this.bot)
  }

  // Cycle Reference
  get interface() { return this }
  get wapp() { return this.bot.wapp }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Add Action
  get add(): (typeof Execute.prototype.add) {
    return this.execute.add.bind(this.execute)
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Set Venom Options
  async setOptions(options: Venom.CreateConfig) {
    if (!is.object(options)) return false
    this.createConfig = options
    return true
  }

  // Start Interface
  async start(session: string): Promise<boolean> {
    try { // Create Venom Instance
      const create = this.misc.handle.safe(Venom.create, Venom)
      const [client, clientError] = await create(
        session,
        null,
        null,
        this.createConfig
      )
      // Check for Error
      if (clientError) throw clientError
      // Assign Client Object to Bot
      this.client = client
      this.started = true
    // If Error Occurred
    } catch (error) {
      // Log Error
      this.bot.log(`Throw(bot::start) Catch(${error})`)
    }
    // Check for Client
    if (!this.client) return false
    // get host data
    const hostDevice = await this.client.getHostDevice()
    this.me = hostDevice.wid
    // Set On-Message Function
    this.client.onMessage(msg => this.execute.onMessage(msg))
    // return done
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */

  // Get Message By Id
  async getMessageById(id: string): Promise<ISent> {
    // Set Get-Message Function
    const getMessage = () => this.client.getMessageById(id)
    const checkMessage = (obj: unknown) => is.object(obj) && !obj.erro
    const trial = this.misc.handle.repeat(
      getMessage.bind(this) as typeof getMessage,
      checkMessage.bind(this)
    )
    return new Promise(resolve => {
      trial
        .catch(error => (n => null)(error) || resolve(null))
        .then(value => resolve(this.wapp.setMessage(value)))
    })
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Text Method
  async sendText(p: { to: string, text: string }): Promise<ISent> {
    // send message
    const sent = await this.client.sendText(p.to, p.text)
    if (!isSentTextObj(is, sent)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(sent.to._serialized)
  }

  // Send Reply Method
  async sendReply(p: { to: string, text: string, quoteId: string }): Promise<ISent> {
    // check if message exists
    const replyTarget = await this.getMessageById(p.quoteId)
    if (!replyTarget) p.quoteId = ''
    // send reply
    const reply = await this.client.reply(p.to, p.text, p.quoteId)
    if (!isSentTextObj(is, reply)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(reply.to._serialized)
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
