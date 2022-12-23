
// ##########################################################################################################################

// Import Misc
import { is, sets, handles } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'
import type { Await } from 'ts-misc/dist/modules/types'

// Import Modules
import type { Trigger, TriggerCall, ClientLike } from './types'

// ##########################################################################################################################

// Timestamp
const t = () => new Date().toLocaleString()

// ##########################################################################################################################

class WhatsappOn<
  C extends ClientLike
> {
  core: WhatsappCore<C>

  // ##########################################################################################################################

  constructor (core: WhatsappCore<C>) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
    // Default Trigger
    this.message({
      name: 'else',
      fun: msg => null
    })
  }

  // ##########################################################################################################################

  // Add On-Message Trigger
  message<A extends string>(trigger: {
    name: A,
    fun: TriggerCall<Await<ReturnType<C['sendMessage']>>, unknown>
  } & (
    A extends 'else'
      ? {}
      : { condition: TriggerCall<Await<ReturnType<C['sendMessage']>>, boolean> }
  )): boolean {
    const { name, condition, fun } = trigger
    // Check Inputs
    if (!is.string(name)) throw new Error('invalid argument "name"')
    if (name.length === 0) throw new Error('invalid argument "name"')
    if (!is.function(fun)) throw new Error('invalid argument "fun"')
    if (!is.function.or.undefined(condition)) throw new Error('invalid argument "condition"')
    // Make action
    let safeTrigger: Trigger<Await<ReturnType<C['sendMessage']>>>
    if (name === 'else') {
      safeTrigger = {
        name: name,
        fun: handles.safe(fun).async
      }
    } else {
      safeTrigger = {
        name: name,
        fun: handles.safe(fun).async,
        condition: handles.safe(condition).async
      }
    }
    // Add trigger
    this.core.triggers[name] = safeTrigger
    // Return done
    return true
  }

  // ##########################################################################################################################

  // Add On-Reply Trigger
  reply(
    id: string,
    fun: TriggerCall<Await<ReturnType<C['sendMessage']>>, unknown>
  ): boolean {
    if (!is.string(id)) throw new Error(`invalid argument "id": ${sets.serialize(id)}`)
    if (!is.function(fun)) throw new Error(`invalid argument fun": ${sets.serialize(fun)}`)
    this.core.repliables[id] = handles.safe(fun).async
    return true
  }
}

// ##########################################################################################################################

class WhatsappRun<
  C extends ClientLike
> {
  core: WhatsappCore<C>

  // ##########################################################################################################################

  constructor (core: WhatsappCore<C>) {
    Object.defineProperty(this, 'core',
      { get() { return core } }
    )
  }

  // ##########################################################################################################################

  // Run Actions
  async triggerLoop(message: Await<ReturnType<C['sendMessage']>>): Promise<void> {
    try {
      // Check All Action Conditions
      for (const trigger of Object.values(this.core.triggers)) {
        if (!is.function(trigger.condition) || trigger.name === 'else') continue
        const [ok, cond] = await trigger.condition(message)
        if (ok && !is.error(cond) && cond) {
          console.log(`[${t()}] Exec(bot::actions[${trigger.name}]) From(${message.from})`)
          const [ok, data] = await trigger.fun(message)
          if (!ok || is.error(data)) {
            console.error(`[${t()}] Throw(bot::actions[${trigger.name}]) Catch(${data})`)
          }
        }
      }
      // do Else
      const trigger = this.core.triggers.else
      console.log(`[${t()}] Exec(bot::actions[${trigger.name}]) From(${message.from})`)
      const [ok, data] = await trigger.fun(message)
      if (!ok || is.error(data)) {
        console.error(`[${t()}] Throw(bot::actions[${trigger.name}]) Catch(${data})`)
      }
    // if error occurred
    } catch (error) {
      console.error(`[${t()}] Throw(bot::action_loop) Catch(${error})`)
    }
  }

  // ##########################################################################################################################

  // Run On-Message Trigger
  async message(message: Await<ReturnType<C['sendMessage']>>): Promise<void> {
    // Prevent execution if bot not available
    if (!this.core.client) return
    // Check Parameter
    if (!is.object(message)) return
    if (!is.in(message, 'body')) return
    // Prevent Broadcast
    if (message.from === 'status@broadcast') return
    // Check for Group Message
    const isGroup = message.author !== undefined
    // Check Quoted Message
    if (message.hasQuotedMsg) {
      return await this.reply(message)
    }
    // Check Mentioned
    const ment = message.body.includes(`@${this.core.client.info.wid.user}`)
    // Run Action-Loop
    if (ment || !isGroup) {
      return await this.triggerLoop(message)
    }
  }

  // ##########################################################################################################################

  // Run On-Reply Trigger
  async reply(message: Await<ReturnType<C['sendMessage']>>): Promise<void> {
    // Check for Quoted-Message Object
    if (!message.hasQuotedMsg) throw new Error('invalid argument "message"')
    const target = await message.getQuotedMessage()
    // Search for Message Id
    if (is.in(this.core.repliables, target.id._serialized)) {
      // Run On-Reply action if found
      const [ok, data] = await this.core.repliables[target.id._serialized](message)
      if (!ok || is.error(data)) {
        console.error(`[${t()}] Throw(bot::repliables[${target.id._serialized}]) Catch(${data})`)
      }
    }
  }
}

// ##########################################################################################################################

export default class WhatsappCore<
  C extends ClientLike
> {
  client: C
  triggers: Record<string, Trigger<Await<ReturnType<C['sendMessage']>>>>
  repliables: Record<string, TriggerCall<Await<ReturnType<C['sendMessage']>>, SafeReturn<unknown>>>
  on: WhatsappOn<C>
  run: WhatsappRun<C>

  // ##########################################################################################################################

  constructor (client: C) {
    Object.defineProperty(this, 'client',
      { get() { return client } }
    )
    // Set Properties
    this.triggers = {}
    this.repliables = {}
    // Set Triggers
    this.on = new WhatsappOn(this)
    this.run = new WhatsappRun(this)
  }
}

// ##########################################################################################################################
