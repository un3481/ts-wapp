// ##########################################################################################################################

// Import Venom
import Venom from 'venom-bot'

// Import Super-Guard
import { is, sets, handles } from 'ts-misc'

// Import Modules Types
import { isTarget } from './types.js'
import type { TExec, TFetchString, IMessage, ITarget } from './types'

// Import Modules
import WhatsappCore from './core/index.js'
import Chat from './chat.js'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

export default class Wapp {
  core: WhatsappCore
  target: ITarget
  chat: Chat
  contacts: Record<string, string>

  // Host Device
  get me() {
    return this.core.me
  }

  // ##########################################################################################################################

  constructor (source: Venom.Whatsapp | ITarget) {
    // Verify Input
    if (source instanceof Venom.Whatsapp) {
      this.core = new WhatsappCore(this, source)
    } else if (isTarget(source)) {
      this.target = source
    }
    // Set Properties
    this.chat = new Chat(this)
    this.contacts = {}
  }

  // ##########################################################################################################################

  // Add On-Message Action
  get onMessage(): (typeof WhatsappCore.prototype.onMessage) {
    return this.core.onMessage
  }

  // Get Venom-Bot Host
  get getHostDevice(): (typeof WhatsappCore.prototype.getHostDevice) {
    return this.core.getHostDevice
  }

  // Get Message
  get getMessageById(): (typeof WhatsappCore.prototype.getMessageById) {
    return this.core.getMessageById
  }

  // ##########################################################################################################################

  // Get Contact Number by Name
  getContactByName(to: string, flag?: number): string {
    let contact = `${to}`
    // Get Contacts List
    let contacts = sets.serialize(
      this.contacts
    )
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

  // ##########################################################################################################################

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

  // ##########################################################################################################################

  // Message Constructor
  setMessage(sent: Venom.Message): IMessage {
    // Prevent Empty Message Objects
    if (!is.object(sent)) throw new Error(`(T78J) invalid argument "sent": ${sets.serialize(sent)}`)
    // Fix Author on Private Messages
    if (!sent.isGroupMsg) sent.author = sent.from
    // Allow Cyclic Reference
    const wapp = this
    // Assign Message Properties
    const message = Object.defineProperties(
      {} as IMessage,
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
          quotedMsg: (
            is.object.in(sent, 'quotedMsgObj')
              ? wapp.setMessage(sent.quotedMsgObj)
              : null
          ),
          quotedMsgObj: sent.quotedMsgObj,
          // Send Message to Chat
          async send(p: {
            text?: TFetchString,
            log?: TFetchString,
            quote?: TFetchString
          }): Promise<IMessage> {
            return this.wapp.send({
              to: this.from,
              text: p.text,
              log: p.log,
              quote: p.quote
            })
          },
          // Quote Message
          async quote(p: {
            text?: TFetchString,
            log?: TFetchString
          }): Promise<IMessage> {
            return this.send({
              text: p.text,
              log: p.log,
              quote: this.id
            })
          },
          // Set On-Reply Action
          get on() {
            return {
              reply(execute: TExec) {
                if (!is.function(execute)) throw new Error(`(4RCD) invalid argument "execute": ${this.misc.sets.serialize(sent)}`)
                wapp.core.onReply({
                  id: sent.id,
                  do: execute
                })
                return true
              }
            }
          },
          // Clean Message Text
          clean(): string {
            return wapp.chat.clean(this.body)
          }
        })
      }
    )
    // return Message Object
    return message
  }

  // ##########################################################################################################################

  // Send Message Method
  async send(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quote?: TFetchString
  }): Promise<IMessage> {
    // check if bot has started
    if (!this.core.client) throw new Error('(TH3E) bot not available')
    // fetch text data
    let to = await this.fetch(p.to)
    let text = await this.fetch(p.text)
    let log = await this.fetch(p.log)
    const quote = await this.fetch(p.quote)
    // check params consistency
    if (!is.string(to)) throw new Error(`(YJ87) invalid argument "to": ${sets.serialize(to)}`)
    if (!is.string.or.null(text)) throw new Error(`(RTHE) invalid argument "text": ${sets.serialize(text)}`)
    if (!is.string.or.null(log)) throw new Error(`(GH5H) invalid argument "log": ${sets.serialize(log)}`)
    if (!is.string.or.null(quote)) throw new Error(`(867G) invalid argument "quote": ${sets.serialize(quote)}`)
    // fix parameters
    text = text || ''
    log = log || 'wapp::send'
    // get number from contacts
    to = this.getContactByName(to)
    // send message
    const result = (quote
      ? await handles.safe(
        this.core.sendReply,
        this.core
      )({ to: to, text: text, quote: quote })
      : await handles.safe(
        this.core.sendText,
        this.core
      )({ to: to, text: text })
    )
    // set message object
    const [data, sendMessageError] = result
    // check for error
    if (sendMessageError) {
      await console.error(`[${t()}] Throw(wapp::send) Catch(${sendMessageError})`)
      throw sendMessageError
    }
    if (!is.object(data)) {
      throw new Error(
        `(35RT) invalid response from sendMessage: ${sets.serialize(data)}`
      )
    }
    // on success
    await console.log(`[${t()}] Sent(${log}) To(${to})`)
    const sent = this.setMessage(data)
    // return message
    return sent
  }

  // ##########################################################################################################################

  // Safe Send Message Method
  async sends(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quote?: TFetchString
  }) {
    const send = handles.safe(this.send, this)
    return send(p)
  }
}

// ##########################################################################################################################
