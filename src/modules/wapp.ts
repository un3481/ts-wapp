// ##########################################################################################################################

// Import Venom
import { Client, Message, MessageSendOptions } from 'whatsapp-web.js'

// Import Super-Guard
import { is, sets, handles } from 'ts-misc'
import { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Modules Types
import { isTarget, IMessageProxyHandler } from './types'
import type { IMessage, ITarget } from './types'

// Import Modules
import Core from './core'
import Chat from './chat'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

export default class Wapp {
  core: Core
  client: Client
  target: ITarget
  chat: Chat
  contacts: Record<string, string>

  // ##########################################################################################################################

  constructor (source: Client | ITarget) {
    // Verify Input
    if (source instanceof Client) {
      Object.defineProperty(this, 'client',
        { get() { return source } }
      )
      this.core = new Core(this)
    } else if (isTarget(source)) {
      this.target = source
    }
    // Set Properties
    this.chat = new Chat(this)
    this.contacts = {}
  }

  // ##########################################################################################################################

  // Add On-Message Action
  get onMessage(): (typeof Core.prototype.onMessage) {
    return this.core.onMessage
  }

  // ##########################################################################################################################

  // Message Constructor
  setMessage(sent: Message): IMessage {
    // Prevent Empty Message Objects
    if (!is.object(sent)) throw new Error('invalid argument "sent"')
    // Allow Cyclic Reference
    const wapp = this
    Object.defineProperty(sent, 'wapp',
      { get() { return wapp } }
    )
    // Return IMessage Proxy
    return new Proxy(
      sent as unknown as IMessage,
      IMessageProxyHandler
    )
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

  // Send Message Method
  async send(p: {
    to: string,
    content: string,
    log?: string,
    options?: MessageSendOptions
  }): Promise<SafeReturn<IMessage>> {
    let { to, content, log, options } = p
    // check if client is available
    if (!this.core.client) throw new Error('(TH3E) client not available')
    // Check inputs
    if (!is.string(to)) throw new Error(`(YJ87) invalid argument "to": ${sets.serialize(to)}`)
    if (!is.string(content)) throw new Error(`(RTHE) invalid argument "text": ${sets.serialize(content)}`)
    if (!is.string.or.undefined(log)) throw new Error(`(GH5H) invalid argument "log": ${sets.serialize(log)}`)
    if (!is.object.or.undefined(options)) throw new Error(`(867G) invalid argument "quote": ${sets.serialize(options)}`)
    // Fix inputs
    log = log || 'wapp::send'
    // Get number from contacts
    to = this.getContactByName(to)
    // Send Message
    const result = await handles.safe(this.core.client.sendMessage).async(to, content, options)
    // Get Message object
    const [ok, message] = result
    // Check for error
    if (!ok || is.error(message)) {
      console.error(`[${t()}] Throw(wapp::send) Catch(${message})`)
      return [false, message as Error]
    }
    if (!is.object(message)) {
      return [
        false,
        new Error(
          `(35RT) invalid response from sendMessage: ${sets.serialize(message)}`
        )
      ]
    }
    // log success
    console.log(`[${t()}] Sent(${log}) To(${to})`)
    // return message
    return [true, this.setMessage(message)]
  }
}

// ##########################################################################################################################
