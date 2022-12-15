
// ##########################################################################################################################

// Import Venom
import type Venom from 'venom-bot'

// Import Modules
import type Wapp from '../wapp'
import Client from './client'
import Execute from './execute'

// ##########################################################################################################################

export default class WhatsappCore {
  wapp: Wapp
  whatsapp: Venom.Whatsapp
  client: Client
  execute: Execute

  get me() { return this.client.me }

  // ##########################################################################################################################

  constructor (wapp: Wapp, whatsapp: Venom.Whatsapp) {
    Object.defineProperty(this, 'wapp',
      { get() { return wapp } }
    )
    Object.defineProperty(this, 'whatsapp',
      { get() { return whatsapp } }
    )
    // Add Properties
    this.client = new Client(this)
    this.execute = new Execute(this)
    // Default Action
    this.onMessage({
      action: 'else',
      do: msg => null
    })
  }

  // ##########################################################################################################################

  // Get Venom-Bot Host
  get getHostDevice(): (typeof Client.prototype.getHostDevice) {
    return this.client.getHostDevice.bind(this.client)
  }

  // Get Message By Id
  get getMessageById(): (typeof Client.prototype.getMessageById) {
    return this.client.getMessageById.bind(this.client)
  }

  // Send Text Method
  get sendText(): (typeof Client.prototype.sendText) {
    return this.client.sendText.bind(this.client)
  }

  // Send Reply Method
  get sendReply(): (typeof Client.prototype.sendReply) {
    return this.client.sendReply.bind(this.client)
  }

  // ##########################################################################################################################

  // Add On-Message Trigger
  get onMessage(): (typeof Execute.prototype.onMessage) {
    return this.execute.onMessage.bind(this.execute)
  }

  // Add On-Message Trigger
  get onReply(): (typeof Execute.prototype.onReply) {
    return this.execute.onReply.bind(this.execute)
  }

  // Execute On-Message Triggers
  get runOnMessage(): (typeof Execute.prototype.runOnMessage) {
    return this.execute.runOnMessage.bind(this.execute)
  }
}

// ##########################################################################################################################
