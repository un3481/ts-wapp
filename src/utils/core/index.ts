
// ##########################################################################################################################

// Import Venom
import Venom from 'venom-bot'

// Import Super-Guard
import { is, sync, handles } from 'ts-misc'

// Import Modules
import Wapp from '../wapp.js'
import Execute from './execute.js'

// Import Types
import type { IMessage, IMessageTextObj, WappHostDevice } from '../types.js'

// ##########################################################################################################################

// Check if Is Sent Text Object
const isSentTextObj = (obj: unknown): obj is IMessageTextObj => {
  // Check Object Properties
  if (!is.object(obj)) return false
  else if (!is.object.in(obj, 'to')) return false
  else if (!is.string.in(obj.to, '_serialized')) return false
  else return true
}

// ##########################################################################################################################

export default class Core {
  client: Venom.Whatsapp
  createConfig: Venom.CreateConfig
  execute: Execute
  me: WappHostDevice
  wapp: Wapp

  // ##########################################################################################################################

  constructor (wapp: Wapp, client: Venom.Whatsapp) {
    Object.defineProperty(this, 'client',
      { get() { return client } }
    )
    Object.defineProperty(this, 'wapp',
      { get() { return wapp } }
    )
    // Add Properties
    this.execute = new Execute(this)
    this.me = sync.waitSync(this.getHostDevice())
  }

  // ##########################################################################################################################

  // On-Message Trigger
  get onMessage(): (typeof Execute.prototype.onMessage) {
    return this.execute.onMessage.bind(this.execute)
  }

  // On-Message Trigger
  get onReply(): (typeof Execute.prototype.onReply) {
    return this.execute.onReply.bind(this.execute)
  }

  // Get Venom-Bot Host
  async getHostDevice(): Promise<WappHostDevice> {
    const hd = await this.client.getHostDevice()
    return { ...hd.wid, session: this.client.session }
  }

  // Get Message By Id
  async getMessageById(id: string): Promise<IMessage> {
    // Set Get-Message Function
    const getMessage = () => this.client.getMessageById(id)
    const checkMessage = (obj: unknown) => (
      is.object(obj) && (!is.in(obj, 'erro') || !obj.erro)
    )
    const trial = handles.repeat(
      getMessage.bind(this) as typeof getMessage,
      checkMessage.bind(this)
    )
    return new Promise(resolve => {
      trial
        .catch(error => (error && null) || resolve(null))
        .then(value => resolve(
          is.object(value)
            ? this.wapp.setMessage(value as Venom.Message)
            : null
        ))
    })
  }

  /*
  ##########################################################################################################################
  */

  // Send Text Method
  async sendText(p: { to: string, text: string }): Promise<IMessage> {
    const { to, text } = p
    // send message
    const sent = await this.client.sendText(to, text)
    if (!isSentTextObj(sent)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(sent.to._serialized)
  }

  // Send Reply Method
  async sendReply(p: { to: string, text: string, quote: string }): Promise<IMessage> {
    const { to, text, quote } = p
    // check if message exists
    const replyTarget = await this.getMessageById(quote)
    const quoteId = !is.null(replyTarget) ? quote : ''
    // send reply
    const reply = await this.client.reply(to, text, quoteId)
    if (!isSentTextObj(reply)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(reply.to._serialized)
  }
}

/*
##########################################################################################################################
*/
