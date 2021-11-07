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
  get interface() { return this.wapp.client }
  get wapp() { return this.bot.wapp }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Get Message Method
  async onMessage(message: Venom.Message): Promise<unknown> {
    // Prevent execution if bot not started
    if (!this.interface.started) return
    else if (!is.object(message)) return
    else if (!is.in(message, 'body')) return
    else if (message.from === 'status@broadcast') return
    const uSent = this.wapp.setMessage(message)
    const isGroup = uSent.isGroupMsg === true
    const ment = uSent.body.includes(`@${this.interface.me.user}`)
    if (ment) await uSent.quote({ text: this.bot.chat.gotMention, log: 'got_mention' })
    if (is.object(uSent.quotedMsg)) return await this.onReply(uSent)
    const data = (ment || !isGroup) ? await this.doAction(uSent) : null
    return data
  }

  // Get Reply Method
  async onReply(message: IMessage) {
    // Check for Quoted-Message Object
    if (!message.quotedMsg) return
    const replyable = message.quotedMsg.id
    if (is.in(this.wapp.replyables, replyable)) {
      return await this.wapp.replyables[replyable](message)
    }
  }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Execute Bot Command
  async doAction(message: IMessage): Promise<any> {
    // set initial
    let actionName: string
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.actions)) {
        if (action.condition && action.name !== 'else') {
          const [cond, condError] = await action.condition(message)
          if (cond && !condError) {
            actionName = action.name
            this.bot.log(`Exec(bot::${action.name}) From(${message.from})`)
            const [data, actionError] = await action.do(message)
            if (actionError) throw actionError
            else return data
          }
        }
      }
      // do Else
      const action = this.actions.else
      actionName = action.name
      this.bot.log(`Exec(bot::${action.name}) From(${message.from})`)
      const [data, actionError] = await action.do(message)
      if (actionError) throw actionError
      else return data
    // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(bot::${actionName}) Catch(${error})`)
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
    if (!is.function(p.do)) return false
    if (!is.function.or.null(condition)) return false
    if (!is.string(action)) return false
    if (action.length === 0) return false
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
