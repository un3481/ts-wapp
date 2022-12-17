
// ##########################################################################################################################

// Import Venom
import type { Message } from 'whatsapp-web.js'

// Import Misc
import { is, sets, handles } from 'ts-misc'

// Import Modules
import type Wapp from './wapp'
import type { IAction, TExec, TAExec, IMessage } from './types'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

export default class Core {
  wapp: Wapp
  actions: Record<string, IAction>
  repliables: Record<string, TAExec>

  get client() { return this.wapp.client }

  // ##########################################################################################################################

  constructor (wapp: Wapp) {
    Object.defineProperty(this, 'wapp',
      { get() { return wapp } }
    )
    // Set Properties
    this.actions = {}
    this.repliables = {}
    // Default Action
    this.onMessage({
      action: 'else',
      do: msg => null
    })
  }

  // ##########################################################################################################################

  // Add On-Message Trigger
  onMessage<A extends string>(
    p: { action: A, do: TExec } & (
      A extends 'else' ? {} : { condition: TExec }
    )
  ): boolean {
    const { action, condition } = p
    // Check Inputs
    if (!is.string(action)) throw new Error('invalid argument "action"')
    if (action.length === 0) throw new Error('invalid argument "action"')
    if (!is.function(p.do)) throw new Error('invalid argument "do"')
    if (!is.function.or.undefined(condition)) throw new Error('invalid argument "condition"')
    // Make action
    let item: IAction
    if (action === 'else') {
      item = {
        name: action,
        do: handles.safe(p.do).async
      }
    } else {
      item = {
        name: action,
        condition: handles.safe(condition).async,
        do: handles.safe(p.do).async
      }
    }
    // Add action
    this.actions[action] = item
    // Return done
    return true
  }

  // ##########################################################################################################################

  // Add On-Reply Trigger
  onReply(p: { id: string, do: TExec }): boolean {
    const { id } = p
    if (!is.string(id)) throw new Error(`(V432) invalid argument "id": ${sets.serialize(id)}`)
    if (!is.function(p.do)) throw new Error(`(U74H) invalid argument "do": ${sets.serialize(p.do)}`)
    this.repliables[id] = handles.safe(p.do).async
    return true
  }

  // ##########################################################################################################################

  // Run Actions
  async runActionLoop(message: IMessage): Promise<void> {
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.actions)) {
        if (action.condition && action.name !== 'else') {
          const [cond, condError] = await action.condition(message)
          if (cond && !condError) {
            console.log(`[${t()}] Exec(bot::actions[${action.name}]) From(${message.from})`)
            const [ok, data] = await action.do(message)
            if (!ok || is.error(data)) {
              console.error(`[${t()}] Throw(bot::actions[${action.name}]) Catch(${data})`)
            }
          }
        }
      }
      // do Else
      const action = this.actions.else
      console.log(`[${t()}] Exec(bot::actions[${action.name}]) From(${message.from})`)
      const [ok, data] = await action.do(message)
      if (!ok || is.error(data)) {
        console.error(`[${t()}] Throw(bot::actions[${action.name}]) Catch(${data})`)
      }
    // if error occurred
    } catch (error) {
      console.error(`[${t()}] Throw(bot::action_loop) Catch(${error})`)
    }
  }

  // ##########################################################################################################################

  // Run On-Message Trigger
  async runOnMessage(message: Message): Promise<void> {
    // Prevent execution if bot not available
    if (!this.client) return
    // Check Parameter
    if (!is.object(message)) return
    if (!is.in(message, 'body')) return
    // Prevent Broadcast
    if (message.from === 'status@broadcast') return
    // Set Message Object
    const sent = this.wapp.setMessage(message)
    // Check for Group Message
    const isGroup = sent.author !== undefined
    // Check Mentioned
    const ment = sent.body.includes(`@${this.client.info.wid.user}`)
    if (ment) {
      await sent.reply({
        content: this.wapp.chat.gotMention,
        log: 'got_mention'
      })
    }
    // Check Quoted Message
    if (sent.hasQuotedMsg) {
      return await this.runOnReply(sent)
    }
    // Run Action-Loop
    if (ment || !isGroup) {
      return await this.runActionLoop(sent)
    }
  }

  // ##########################################################################################################################

  // Run On-Reply Trigger
  async runOnReply(message: IMessage): Promise<void> {
    // Check for Quoted-Message Object
    if (!message.hasQuotedMsg) throw new Error('invalid argument "message"')
    const target = await message.getQuotedMessage()
    // Search for Message Id
    if (is.in(this.repliables, target.id._serialized)) {
      // Run On-Reply action if found
      const [ok, data] = await this.repliables[target.id._serialized](message)
      if (!ok || is.error(data)) {
        console.error(`[${t()}] Throw(bot::repliables[${target.id._serialized}]) Catch(${data})`)
      }
    }
  }
}

// ##########################################################################################################################
