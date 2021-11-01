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
  get interface() { return this.wapp.interface }
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
        if (action.cond && action.name !== 'else') {
          const [cond, condError] = await action.cond(message)
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
  add<N extends string>(
    name: N,
    ...params: N extends 'else'
      ? [exec: TExec]
      : [exec: TExec, success: TExec]
  ) {
    // Get Params
    const [exec, success] = params
    // Check Inputs
    if (!is.function(exec)) return false
    if (success && !is.function(success)) return false
    if (!is.string(name)) return false
    if (name.length === 0) return false
    // Execute Action
    let action: IAction
    action = {
      name: name,
      cond: this.misc.handle.safe(exec),
      do: this.misc.handle.safe(success)
    }
    if (name === 'else') {
      action = {
        name: name,
        do: this.misc.handle.safe(exec)
      }
    }
    this.actions[name] = action
    return true
  }
}

/*
##########################################################################################################################
#                                                    AUXILIARY METHODS                                                   #
##########################################################################################################################
*/
