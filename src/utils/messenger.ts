/*
##########################################################################################################################
#                                                       AVBOT WHAPP                                                      #
##########################################################################################################################
*/

// Import Venom
import Venom from 'venom-bot'
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device'

// Import Bot Type
// eslint-disable-next-line import/no-duplicates
import type Bot from './bot.js'
// eslint-disable-next-line import/no-duplicates
import type { TExec, TAExec } from './bot.js'

// Import FS
import fs from 'fs'

/*
##########################################################################################################################
#                                                    MESSAGE INTERFACES                                                  #
##########################################################################################################################
*/

// Message Text Type
export type TFetchString = string | Promise<string> | (() => string | Promise<string>)

// Sent Message Interface
export interface ISent extends Venom.Message {
  readonly whapp: Whapp
  readonly quotedMsg: ISent
  send(msg: TFetchString, log?: TFetchString, quoteId?: TFetchString): Promise<ISent>
  quote(msg: TFetchString, log?: TFetchString): Promise<ISent>
  onReply(exec: TExec): boolean
  clean(): string
}

// Sent Text Object
export interface ISentTextObj {
  to: { _serialized: string }
}

// Type Guards
export class WhappTypeGuards {
  bot: Bot

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
  }

  // Check if Is Sent Text Object
  isSentTextObj(obj: unknown): obj is ISentTextObj {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Check Object Properties
    if (!is.object(obj)) return false
    else if (!is.in(obj, 'to')) return false
    else if (!is.object(obj.to)) return false
    else if (!is.in(obj.to, '_serialized')) return false
    else if (!is.string(obj.to._serialized)) return false
    else return true
  }
}

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export default class Whapp {
  bot: Bot
  client: Venom.Whatsapp
  me: VenomHostDevice.Me
  replyables: Record<string, TAExec>
  typeGuards: WhappTypeGuards

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Set Replyables List
    this.replyables = {}
    this.typeGuards = new WhappTypeGuards(this.bot)
  }

  // Cycle Reference
  get whapp() { return this }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Start Whapp
  async start(session: string): Promise<boolean> {
    try { // Create Venom Instance
      const create = this.misc.handle.safe(Venom.create, Venom)
      const [client, clientError] = await create(session)
      // Check for Error
      if (clientError) throw clientError
      // Assign Client Object to Bot
      this.client = client
    // If Error Occurred
    } catch (error) {
      // Log Error
      await this.bot.log(`Throw(bot::start) Catch(${error})`)
    }
    // Check for Client
    if (!this.client) return false
    // get host data
    const hostDevice = await this.client.getHostDevice()
    this.me = hostDevice.wid
    // Set On-Message Function
    this.client.onMessage(msg => this.whapp.onMessage(msg))
    // return done
    return true
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Get Message Method
  async onMessage(message: Venom.Message): Promise<any> {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Prevent execution if bot not started
    if (!this.bot.started) return
    else if (!is.object(message)) return
    else if (!is.in(message, 'body')) return
    else if (message.from === 'status@broadcast') return
    const uSent = this.setMessage(message)
    const isGroup = uSent.isGroupMsg === true
    const ment = uSent.body.includes(`@${this.whapp.me.user}`)
    if (ment) await uSent.quote(this.bot.chat.gotMention, 'got_mention')
    if (is.object(uSent.quotedMsg)) return await this.onReply(uSent)
    const data = (ment || !isGroup) ? await this.bot.execute(uSent) : null
    return data
  }

  // Get Reply Method
  async onReply(message: ISent) {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Check for Quoted-Message Object
    if (!message.quotedMsg) return
    const replyable = message.quotedMsg.id
    if (is.in(this.whapp.replyables, replyable)) {
      return await this.whapp.replyables[replyable](message)
    }
  }

  // Add On-Reply Action
  addReplyable(sentId: string, exec: TExec): boolean {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Check if Executable is Function
    if (!is.function(exec)) return false
    this.replyables[sentId] = this.misc.handle.safe(exec)
    return true
  }

  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */

  // fetch data for message
  async fetch(data: TFetchString): Promise<string> {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Set Resolution Variable
    let resolution: string = null
    // check type-of input
    if (is.string(data)) resolution = data
    else if (this.misc.guards.is.promise(data)) resolution = await data
    else if (is.function(data)) {
      const preRes = data()
      if (is.string(preRes)) resolution = preRes
      else if (this.misc.guards.is.promise(preRes)) resolution = await preRes
    }
    // check type-of output
    if (!is.string(resolution)) resolution = null
    // return text
    return resolution
  }

  // get contacts list
  contactsList(flag?: number): Record<string, string> {
    // check if directory exists
    if (!fs.existsSync('./private')) {
      fs.mkdirSync('./private')
    }
    // check if file exists
    if (!fs.existsSync('./private/contacts.bot.json')) {
      fs.writeFileSync('./private/contacts.bot.json', '{}')
    }
    // get contacts from json
    let contacts: Record<string, string> = JSON.parse(
      fs.readFileSync('./private/contacts.bot.json').toString()
    )
    // use flags
    if (flag === -1) {
      contacts = Object.entries(contacts)
        .reduce((ret, entry) => {
          const [key, value] = entry
          ret[value] = key
          return ret
        }, {})
    }
    // return contacts
    return contacts
  }

  // replace contact name
  contact(to: string, flag?: number): string {
    const params = []
    let contact = `${to}`
    if (flag) params.push(flag)
    const contacts = this.contactsList(...params)
    // replace cyclicaly
    while (Object.keys(contacts).includes(contact)) {
      contact = contacts[contact]
    }
    // return result
    return contact
  }

  // Get Message By Id
  async getMessageById(id: string): Promise<ISent> {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Set Get-Message Function
    const getMessage = () => this.client.getMessageById(id)
    const checkMessage = (obj: unknown) => is.object(obj) && !obj.erro
    const trial = this.misc.handle.repeat(getMessage.bind(this) as typeof getMessage, checkMessage.bind(this))
    return new Promise(resolve => {
      trial
        .catch(error => (n => null)(error) || resolve(null))
        .then(value => resolve(this.setMessage(value)))
    })
  }

  /*
  ##########################################################################################################################
  #                                                    MESSAGE CONSTRUCTOR                                                 #
  ##########################################################################################################################
  */

  // Message Constructor
  setMessage(sent: Venom.Message): ISent {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // Prevent Empty Message Objects
    if (!sent || !is.object(sent)) return
    // Fix Author on Private Messages
    if (!sent.isGroupMsg) sent.author = sent.from
    // Allow Cyclic Reference
    const whapp = this
    // Assign Message Properties
    const message: ISent = Object.defineProperty(
      Object.assign({}, sent,
        {
          // Whapp
          get whapp () { return whapp },
          // Set Properties
          id: sent.id,
          body: sent.body,
          // Fix Contact Names
          from: whapp.contact(sent.from, -1),
          author: whapp.contact(sent.author, -1),
          // Fix Quoted Message Object
          quotedMsg: whapp.setMessage(sent.quotedMsgObj),
          quotedMsgObj: sent.quotedMsgObj,
          // Send Message to Chat
          async send(msg: TFetchString, log?: TFetchString, quoteId?: TFetchString): Promise<ISent> {
            return this.whapp.send(this.from, msg, log, quoteId)
          },
          // Quote Message
          async quote(msg: TFetchString, log?: TFetchString): Promise<ISent> {
            return this.send(msg, log, this.id)
          },
          // Set On-Reply Action
          onReply(exec: TExec): boolean {
            if (!is.function(exec)) return false
            this.whapp.addReplyable(this.id, exec)
            return true
          },
          // Clean Message Text
          clean(): string {
            return this.whapp.bot.chat.clean(this.body)
          }
        }
      ),
      // Set Getter
      'whapp',
      { get() { return whapp } }
    )
    // return Message Object
    return message
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Text Method
  async sendText(to: string, text: string): Promise<ISent> {
    // send message
    const sent = await this.client.sendText(to, text)
    if (!this.typeGuards.isSentTextObj(sent)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(sent.to._serialized)
  }

  // Send Reply Method
  async sendReply(to: string, text: string, quoteId: string): Promise<ISent> {
    // check if message exists
    const replyTarget = await this.getMessageById(quoteId)
    if (!replyTarget) quoteId = ''
    // send reply
    const reply = await this.client.reply(to, text, quoteId)
    if (!this.typeGuards.isSentTextObj(reply)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(reply.to._serialized)
  }

  // Send Message Method
  async send(
    to: TFetchString,
    text: TFetchString,
    log?: TFetchString,
    quoteId?: TFetchString
  ): Promise<ISent> {
    // Global Type-Guard
    const is = this.bot.misc.guards.is
    // check if bot has started
    if (!this.bot.started) throw new Error('bot not started')
    // fetch text data
    to = await this.fetch(to)
    text = await this.fetch(text)
    log = await this.fetch(log)
    quoteId = await this.fetch(quoteId)
    // check params consistency
    if (!is.string(to)) throw new Error('argument "to" not valid')
    if (!is.string(text)) throw new Error('argument "text" not valid')
    if (log && !is.string(log)) throw new Error('argument "log" not valid')
    if (quoteId && !is.string(quoteId)) throw new Error('argument "quoteId" not valid')
    // get number from contacts
    const phoneNumber = this.contact(to)
    // set message object
    const result = (quoteId
      ? await this.misc.handle.safe(this.sendReply, this)(phoneNumber, text, quoteId)
      : await this.misc.handle.safe(this.sendText, this)(phoneNumber, text)
    )
    // send message
    const [data, sendMessageError] = result
    // check for error
    if (sendMessageError) {
      await this.bot.log(`Throw(bot::send_msg) Catch(${sendMessageError})`)
      throw sendMessageError
    }
    // on success
    await this.bot.log(`Sent(${log}) To(${to})`)
    const sent = this.setMessage(data)
    // return message
    return sent
  }

  // Safe Send Message Method
  async sends(
    to: TFetchString,
    text: TFetchString,
    log?: TFetchString,
    quoteId?: TFetchString
  ): Promise<[ISent, Error]> {
    const send = this.misc.handle.safe(this.send, this)
    return send(to, text, log, quoteId)
  }
}
