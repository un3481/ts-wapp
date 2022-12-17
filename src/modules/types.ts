
// ##########################################################################################################################

// Import Whatsapp Types
import type { Message, MessageSendOptions } from 'whatsapp-web.js'

// Import Express-Core Type
import type { Request } from 'express-serve-static-core'

// Import Misc Types
import { is, guards } from 'ts-misc'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'

// Import Wapp Type
import type Wapp from './wapp'

// ##########################################################################################################################

// Exec Function Type
export type TExec = (m: IMessage) => unknown
export type TAExec = (m: IMessage) => Promise<SafeReturn<unknown>>

// Interface Action Interface
export type IAPIAction = (req: Request) => unknown
export type IAAPIAction = (req: Request) => Promise<SafeReturn<unknown>>

// Action Interface
export interface IAction {
  readonly name: string,
  readonly condition?: TAExec,
  readonly do: TAExec
}

// ##########################################################################################################################

// Target Interface
export interface ITarget {
  readonly address: string
  readonly user: string
  readonly password: string
}

// Check Target Object
export const isTarget = (obj: unknown): obj is ITarget => {
  if (!is.object(obj)) return false
  if (!is.string.in(obj, ['address', 'user', 'password'])) return false
  return true
}

// ##########################################################################################################################

interface NMessage extends Message {
  reply: (p: any) => Promise<any>
}

// Sent Message Interface
export interface IMessage extends NMessage {
  readonly wapp: Wapp
  readonly target: Message
  readonly on: {
    reply(fun: TExec): boolean
  }
  clean(): string
  reply(p: {
    content: string,
    log?: string,
    options?: MessageSendOptions
  }): (
    Promise<SafeReturn<IMessage>>
  )
}

// ##########################################################################################################################

export const IMessageProxyHandler: ProxyHandler<IMessage> = {
  // IMessage Properties
  get<P extends string | symbol>(
    target: unknown,
    p: P,
    receiver: unknown
  ) {
    // Check Guard
    if (!is.object(target)) return undefined
    if (!guards.extend<IMessage>(target)) return null
    // Return original object
    if (p === 'target') { return target }
    // Clean Message Text
    if (p === 'clean') {
      return (): string => {
        return target.wapp.chat.clean(target.body)
      }
    }
    // Get Quoted Message Object
    if (p === 'getQuotedMessage') {
      return async (): Promise<IMessage> => {
        if (target.hasQuotedMsg) {
          const message = await target.getQuotedMessage()
          return target.wapp.setMessage(message)
        }
        return null
      }
    }
    // Fix Contact Names
    if (p === 'from') {
      return target.wapp.getContactByName(target.from, -1)
    }
    if (p === 'author') {
      return (
        target.author
          ? target.wapp.getContactByName(target.author, -1)
          : undefined
      )
    }
    // Set On-Reply Action
    if (p === 'on') {
      return {
        reply(fun: TExec): boolean {
          if (!is.function(fun)) { throw new Error('invalid argument "fun"') }
          target.wapp.core.onReply({
            id: target.id._serialized,
            do: fun
          })
          return true
        }
      }
    }
    // Send Message to Chat
    if (p === 'reply') {
      return (
        async (p: {
          content: string,
          log?: string,
          options?: MessageSendOptions
        }): (
          Promise<SafeReturn<IMessage>>
        ) => {
          return target.wapp.send({
            to: (
              target.fromMe
                ? (await target.getChat()).id._serialized
                : target.from
            ),
            content: p.content,
            log: p.log,
            options: {
              quotedMessageId: target.id._serialized,
              ...p.options
            }
          })
        }
      )
    }
    // Else
    return target[p as keyof IMessage]
  },
  // General Methods
  set(target, p, value) { return null },
  deleteProperty(target, p) { return null },
  defineProperty(target, p, attr) { return null },
  ownKeys(target) {
    return (
      Object
        .getOwnPropertyNames(target)
        .concat(['wapp', 'target', 'on', 'clean'])
    )
  },
  has(target, p) {
    return (p in target) || p in ['wapp', 'target', 'on', 'clean']
  }
}

// ##########################################################################################################################
