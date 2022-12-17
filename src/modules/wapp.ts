// ##########################################################################################################################

// Import Venom
import { Client, Message, MessageSendOptions } from 'whatsapp-web.js'

// Import Super-Guard
import { is, sets, handles } from 'ts-misc'
import { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Modules Types
import { isTarget } from './types'
import type { TExec, IMessage, ITarget } from './types'

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

  // Message Constructor
  setMessage(sent: Message): IMessage {
    // Prevent Empty Message Objects
    if (!is.object(sent)) throw new Error(`(T78J) invalid argument "sent": ${sets.serialize(sent)}`)
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
          // Fix Contact Names
          from: wapp.getContactByName(sent.from, -1),
          author: wapp.getContactByName(sent.author, -1),
          // Fix Quoted Message Object
          getQuotedMessage: async () => {
            if (is.true.in(sent, 'hasQuotedMsg')) {
              const message = await sent.getQuotedMessage()
              return wapp.setMessage(message)
            }
            return null
          },
          // Send Message to Chat
          async send(p: {
            content: string,
            log?: string,
            options?: MessageSendOptions
          }): Promise<SafeReturn<IMessage>> {
            return (this.wapp as Wapp).send({
              to: this.from,
              content: p.content,
              log: p.log,
              options: p.options
            })
          },
          // Set On-Reply Action
          get on() {
            return {
              reply(execute: TExec) {
                if (!is.function(execute)) throw new Error(`(4RCD) invalid argument "execute": ${this.misc.sets.serialize(sent)}`)
                wapp.core.onReply({
                  id: sent.id._serialized,
                  do: execute
                })
                return true
              }
            }
          },
          // Clean Message Text
          async clean(): Promise<string> {
            return await wapp.chat.clean(this.body)
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
    to: string,
    content: string,
    log?: string,
    options?: MessageSendOptions
  }): Promise<SafeReturn<IMessage>> {
    // check if bot has started
    if (!this.core.client) throw new Error('(TH3E) client not available')
    let { to, content, log, options } = p
    // check params consistency
    if (!is.string(to)) throw new Error(`(YJ87) invalid argument "to": ${sets.serialize(to)}`)
    if (!is.string(content)) throw new Error(`(RTHE) invalid argument "text": ${sets.serialize(content)}`)
    if (!is.string.or.undefined(log)) throw new Error(`(GH5H) invalid argument "log": ${sets.serialize(log)}`)
    if (!is.object.or.undefined(options)) throw new Error(`(867G) invalid argument "quote": ${sets.serialize(options)}`)
    // fix parameters
    log = log || 'wapp::send'
    // get number from contacts
    to = this.getContactByName(to)
    // send message
    const result = await handles.safe(this.core.client.sendMessage).async(to, content, options)
    // set message object
    const [ok, message] = result
    // check for error
    if (!ok || is.error(message)) {
      console.error(`[${t()}] Throw(wapp::send) Catch(${message})`)
      return [false, message as Error]
    }
    if (!is.object(message)) return [
      false, 
      new Error(
        `(35RT) invalid response from sendMessage: ${sets.serialize(message)}`
      )
    ]
    // log success
    console.log(`[${t()}] Sent(${log}) To(${to})`)
    // return message
    return [true, this.setMessage(message)]
  }
}

// ##########################################################################################################################
