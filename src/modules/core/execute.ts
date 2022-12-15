
// ##########################################################################################################################

// Import Venom
import type Venom from 'venom-bot'

// Import Misc
import { is, sets, handles } from 'ts-misc'
import type { TSafeAsyncReturn } from 'ts-misc/dist/modules/handles'

// Import Bot Types
import type WhatsappCore from './'
import type { IAction, TExec, TAExec, IMessage } from '../types'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

export default class Execute {
  core: WhatsappCore
  actions: Record<string, IAction>
  repliables: Record<string, TAExec>

  get wapp() { return this.core.wapp }

  // ##########################################################################################################################

  constructor (core: WhatsappCore) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
    // Set Lists
    this.actions = {}
    this.repliables = {}
  }

  // ##########################################################################################################################

  // Execute Actions
  async execute(message: IMessage): Promise<unknown> {
    // set initial
    let actionName: string
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.actions)) {
        if (action.condition && action.name !== 'else') {
          const [cond, condError] = await action.condition(message)
          if (cond && !condError) {
            actionName = action.name
            console.log(`[${t()}] Exec(bot::actions[${action.name}]) From(${message.from})`)
            const [data, actionError] = await action.do(message)
            if (actionError) throw actionError
            else return data
          }
        }
      }
      // do Else
      const action = this.actions.else
      actionName = action.name
      console.log(`[${t()}] Exec(bot::actions[${action.name}]) From(${message.from})`)
      const [data, actionError] = await action.do(message)
      if (actionError) throw actionError
      else return data
    // if error occurred
    } catch (error) {
      // log error
      await console.error(`[${t()}] Throw(bot::actions[${actionName}]) Catch(${error})`)
    }
  }

  // ##########################################################################################################################

  // Run On-Message Triggers
  async runOnMessage(message: Venom.Message): Promise<unknown> {
    // Prevent execution if bot not available
    if (!this.core.client) return
    // Check Parameter
    if (!is.object(message)) return
    if (!is.in(message, 'body')) return
    // Prevent Broadcast
    if (message.from === 'status@broadcast') return
    // Set Message Object
    const sent = this.wapp.setMessage(message)
    // Check for Group Message
    const isGroup = sent.isGroupMsg === true
    // Check Mentioned
    const ment = sent.body.includes(`@${this.core.me.user}`)
    if (ment) {
      await sent.quote({
        text: this.wapp.chat.gotMention,
        log: 'got_mention'
      })
    }
    // Check Quoted Message
    if (is.object.in(sent, 'quotedMsg')) {
      return await this.runOnReply(sent)
    }
    // Execute Actions
    let data = null
    if (ment || !isGroup) {
      data = await this.execute(sent)
    }
    // Return Data
    return data
  }

  // ##########################################################################################################################

  // Run On-Reply Triggers
  async runOnReply(message: IMessage): TSafeAsyncReturn<unknown> {
    // Check for Quoted-Message Object
    if (!is.object.in(message, 'quotedMsg')) {
      throw new Error('invalid argument "message"')
    }
    const replyable = message.quotedMsg.id
    if (is.in(this.repliables, replyable)) {
      return this.repliables[replyable](message)
    }
  }

  // ##########################################################################################################################

  // Add On-Message Trigger
  onMessage(p: {
    action: string,
    condition?: TExec
    do: TExec
  }) {
    // Get Params
    const { action, condition } = p
    // Check Inputs
    if (!is.function(p.do)) throw new Error('invalid argument "do"')
    if (!is.function.or.null(condition)) throw new Error('invalid argument "condition"')
    if (!is.string(action)) throw new Error('invalid argument "action"')
    if (action.length === 0) throw new Error('invalid argument "action"')
    // Execute Action
    let push: IAction
    push = {
      name: action,
      condition: handles.safe(condition),
      do: handles.safe(p.do)
    }
    if (action === 'else') {
      push = {
        name: action,
        do: handles.safe(p.do)
      }
    }
    this.actions[action] = push
    return true
  }

  // ##########################################################################################################################

  // Add On-Reply Trigger
  onReply(p: { id: string, do: TExec }): boolean {
    const { id } = p
    if (!is.string(id)) throw new Error(`(V432) invalid argument "id": ${sets.serialize(id)}`)
    if (!is.function(p.do)) throw new Error(`(U74H) invalid argument "do": ${sets.serialize(p.do)}`)
    this.repliables[id] = handles.safe(p.do)
    return true
  }
}

// ##########################################################################################################################
