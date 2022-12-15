
// ##########################################################################################################################

// Import Venom
import type Venom from 'venom-bot'

// Import Super-Guard
import { is, sync, handles } from 'ts-misc'

// Import Modules
import type WhatsappCore from './'

// Import Types
import type { IMessage, IMessageTextObj, WappHostDevice } from '../types'

// ##########################################################################################################################

export default class Client {
  core: WhatsappCore
  me: WappHostDevice
  createConfig: Venom.CreateConfig

  get wapp() { return this.core.wapp }
  get whatsapp() { return this.core.whatsapp }

  // ##########################################################################################################################

  constructor (core: WhatsappCore) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
    // Set Properties
    this.me = sync.waitSync(this.getHostDevice())
    this.createConfig = this.whatsapp.options
  }

  // ##########################################################################################################################

  // Get Venom-Bot Host
  async getHostDevice(): Promise<WappHostDevice> {
    const hd = await this.whatsapp.getHostDevice()
    return { ...hd.wid, session: this.whatsapp.session }
  }

  // ##########################################################################################################################

  // Get Message By Id
  async getMessageById(id: string): Promise<IMessage | null> {
    // Set Get-Message Function
    const getMessage = () => this.whatsapp.getMessageById(id)
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

  // ##########################################################################################################################

  // Check if Is Sent Text Object
  isSentTextObj(obj: unknown): obj is IMessageTextObj {
    // Check Object Properties
    if (!is.object(obj)) return false
    else if (!is.object.in(obj, 'to')) return false
    else if (!is.string.in(obj.to, '_serialized')) return false
    else return true
  }

  // ##########################################################################################################################

  // Send Text Method
  async sendText(p: { to: string, text: string }): Promise<IMessage | null> {
    const { to, text } = p
    // send message
    const sent = await this.whatsapp.sendText(to, text)
    if (!this.isSentTextObj(sent)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(sent.to._serialized)
  }

  // ##########################################################################################################################

  // Send Reply Method
  async sendReply(p: { to: string, text: string, quote: string }): Promise<IMessage | null> {
    const { to, text, quote } = p
    // check if message exists
    const replyTarget = await this.getMessageById(quote)
    const quoteId = !is.null(replyTarget) ? quote : ''
    // send reply
    const reply = await this.whatsapp.reply(to, text, quoteId)
    if (!this.isSentTextObj(reply)) throw new Error('message not sent')
    // get message by id
    return this.getMessageById(reply.to._serialized)
  }
}

// ##########################################################################################################################
