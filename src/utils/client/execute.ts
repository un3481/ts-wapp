/*
##########################################################################################################################
#                                                         WHATSAPP                                                       #
##########################################################################################################################
*/

// Import Venom
import Venom from 'venom-bot'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Bot Types
import type Bot from '../../index.js'
import type {
  IAction,
  TExec,
  IMessage
} from '../types.js'
import { TSafeAsyncReturn } from 'ts-misc/dist/utils/handle'

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export default class Execute {
  bot: Bot
  actions: Record<string, IAction>

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
    // Set Lists
    this.actions = {}
  }

  // Cycle Reference
  get execute() { return this }
  get client() { return this.wapp.client }
  get wapp() { return this.bot.wapp }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Get Message Method
  async onMessage(message: Venom.Message): Promise<unknown> {
    // Prevent execution if bot not
    if (!this.client.started) return
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
    const ment = sent.body.includes(`@${this.client.me.user}`)
    if (ment) await sent.quote({ text: this.bot.chat.gotMention, log: 'got_mention' })
    // Check Quoted Message
    if (is.in(sent, 'quotedMsg', 'object')) return await this.onReply(sent)
    // Execute Actions
    const data = (ment || !isGroup) ? await this.do(sent) : null
    // Return Data
    return data
  }

  // Get Reply Method
  async onReply(message: IMessage): TSafeAsyncReturn<unknown> {
    // Check for Quoted-Message Object
    if (!message.quotedMsg) throw new Error('invalid parameter "message"')
    const replyable = message.quotedMsg.id
    if (is.in(this.wapp.replyables, replyable)) {
      return this.wapp.replyables[replyable](message)
    }
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Execute Bot Command
  async do(message: IMessage): Promise<unknown> {
    // set initial
    let actionName: string
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.actions)) {
        if (action.condition && action.name !== 'else') {
          const [cond, condError] = await action.condition(message)
          if (cond && !condError) {
            actionName = action.name
            this.bot.log(`Exec(bot::actions[${action.name}]) From(${message.from})`)
            const [data, actionError] = await action.do(message)
            if (actionError) throw actionError
            else return data
          }
        }
      }
      // do Else
      const action = this.actions.else
      actionName = action.name
      this.bot.log(`Exec(bot::actions[${action.name}]) From(${message.from})`)
      const [data, actionError] = await action.do(message)
      if (actionError) throw actionError
      else return data
    // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(bot::actions[${actionName}]) Catch(${error})`)
    }
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Add Bot Action
  add(p: {
    action: string,
    condition?: TExec
    do: TExec
  }) {
    // Get Params
    const { action, condition } = p
    // Check Inputs
    if (!is.function(p.do)) throw new Error('invalid argment "do"')
    if (!is.function.or.null(condition)) throw new Error('invalid argment "condition"')
    if (!is.string(action)) throw new Error('invalid argment "action"')
    if (action.length === 0) throw new Error('invalid argment "action"')
    // Execute Action
    let push: IAction
    push = {
      name: action,
      condition: this.misc.handle.safe(condition),
      do: this.misc.handle.safe(p.do)
    }
    if (action === 'else') {
      push = {
        name: action,
        do: this.misc.handle.safe(p.do)
      }
    }
    this.actions[action] = push
    return true
  }
}

/*
##########################################################################################################################
#                                                    AUXILIARY METHODS                                                   #
##########################################################################################################################
*/
