/*
##########################################################################################################################
#                                                         WHATSAPP                                                       #
##########################################################################################################################
*/

// Import Venom
import Venom from 'venom-bot'

// Import Interface Class
import Interface from './interface'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Bot Types
import type Bot from '../index.js'
import type {
  TExec,
  TAExec,
  TFetchString,
  ISent,
  ITarget
} from './types.js'

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export default class Wapp {
  bot: Bot
  contactsList: Record<string, string>
  replyables: Record<string, TAExec>
  interface: Interface
  target: ITarget | null

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Set Replyables List
    this.replyables = {}
    // Nest Objects
    this.interface = new Interface(this.bot)
  }

  // Cycle Reference
  get wapp() { return this }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Add On-Reply Action
  addReplyable(sentId: string, exec: TExec): boolean {
    // Check if Executable is Function
    if (!is.function(exec)) return false
    this.replyables[sentId] = this.misc.handle.safe(exec)
    return true
  }

  // Get Venom-Bot Host
  getHostDevice() {
    return this.interface.client.getHostDevice()
  }

  // Get Message
  getMessageById(id: string) {
    return this.interface.getMessageById(id)
  }

  // Add Action
  get add(): (typeof Interface.prototype.add) {
    return this.interface.add
  }

  // Start Wapp
  async start(session: string): Promise<boolean> {
    if (!is.null(this.target)) return false
    return this.interface.start(session)
  }

  // Venom-Bot Started
  get started() {
    return this.interface.started
  }

  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */

  // fetch data for message
  async fetch(data: TFetchString): Promise<string> {
    // Set Resolution Variable
    let resolution: string = null
    // check type-of input
    if (is.string(data)) resolution = data
    else if (is.promise(data)) resolution = await data
    else if (is.function(data)) {
      const preRes = data()
      if (is.string(preRes)) resolution = preRes
      else if (is.promise(preRes)) resolution = await preRes
    }
    // check type-of output
    if (!is.string(resolution)) resolution = null
    // return text
    return resolution
  }

  // Set Contacts List
  setContactsList(contactsList: Record<string, string>) {
    this.contactsList = contactsList
    return true
  }

  // Get Contact Number by Name
  getContactByName(to: string, flag?: number): string {
    let contact = `${to}`
    // Get Contacts List
    let contacts = this.misc.sets.serialize(this.contactsList)
    // Switch Key-Value Pairs
    if (flag === -1) {
      contacts = Object.entries(contacts)
        .reduce((ret, entry) => {
          const [key, value] = entry
          ret[value] = key
          return ret
        }, {})
    }
    // replace cyclicaly
    while (Object.keys(contacts).includes(contact)) {
      contact = contacts[contact]
    }
    // return result
    return contact
  }

  /*
  ##########################################################################################################################
  #                                                    MESSAGE CONSTRUCTOR                                                 #
  ##########################################################################################################################
  */

  // Message Constructor
  setMessage(sent: Venom.Message): ISent {
    // Prevent Empty Message Objects
    if (!sent || !is.object(sent)) return
    // Fix Author on Private Messages
    if (!sent.isGroupMsg) sent.author = sent.from
    // Allow Cyclic Reference
    const wapp = this
    // Assign Message Properties
    const message = Object.defineProperties(
      {} as ISent,
      {
        ...Object.getOwnPropertyDescriptors(sent),
        ...Object.getOwnPropertyDescriptors({
          // Wapp
          get wapp () { return wapp },
          // Set Properties
          id: sent.id,
          body: sent.body,
          // Fix Contact Names
          from: wapp.getContactByName(sent.from, -1),
          author: wapp.getContactByName(sent.author, -1),
          // Fix Quoted Message Object
          quotedMsg: wapp.setMessage(sent.quotedMsgObj),
          quotedMsgObj: sent.quotedMsgObj,
          // Send Message to Chat
          async send(p: {
            text?: TFetchString,
            log?: TFetchString,
            quoteId?: TFetchString
          }): Promise<ISent> {
            return this.wapp.send({
              to: this.from,
              text: p.text,
              log: p.log,
              quoteId: p.quoteId
            })
          },
          // Quote Message
          async quote(p: {
            text?: TFetchString,
            log?: TFetchString
          }): Promise<ISent> {
            return this.send({
              text: p.text,
              log: p.log,
              quoteId: this.id
            })
          },
          // Set On-Reply Action
          get on() {
            return {
              reply(exec: TExec): boolean {
                if (!is.function(exec)) return false
                wapp.addReplyable(this.id, exec)
                return true
              }
            }
          },
          // Clean Message Text
          clean(): string {
            return wapp.bot.chat.clean(this.body)
          }
        })
      }
    )
    // return Message Object
    return message
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Message Method
  async send(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quoteId?: TFetchString
  }): Promise<ISent> {
    // check if bot has started
    if (!this.interface.started) throw new Error('bot not started')
    // fetch text data
    let to = await this.fetch(p.to)
    const text = await this.fetch(p.text)
    const log = await this.fetch(p.log)
    const quoteId = await this.fetch(p.quoteId)
    // check params consistency
    if (!is.string(to)) throw new Error('argument "to" not valid')
    if (!is.string(text)) throw new Error('argument "text" not valid')
    if (!is.string.or.null(log)) throw new Error('argument "log" not valid')
    if (!is.string.or.null(quoteId)) throw new Error('argument "quoteId" not valid')
    // get number from contacts
    to = this.getContactByName(to)
    // send message
    const result = (quoteId
      ? await this.misc.handle.safe(
        this.interface.sendReply,
        this.interface
      )({ to: to, text: text, quoteId: quoteId })
      : await this.misc.handle.safe(
        this.interface.sendText,
        this.interface
      )({ to: to, text: text })
    )
    // set message object
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
  async sends(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quoteId?: TFetchString
  }) {
    const send = this.misc.handle.safe(this.send, this)
    return send(p)
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
