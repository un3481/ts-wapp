
// ##########################################################################################################################

// Import Whatsapp Types
import type { Message, MessageSendOptions } from 'whatsapp-web.js'

// Import Express-Core Type
import type * as expressCore from 'express-serve-static-core'

// Import Misc Types
import { is } from 'ts-misc'
import type * as M from 'ts-misc/dist/modules/handles'

// Import Wapp Type
import type Wapp from './wapp'

// ##########################################################################################################################

// Exec Function Type
export type TExec = (m: IMessage) => unknown
export type TAExec = (m: IMessage) => Promise<M.SafeReturn<unknown>>

// Interface Action Interface
export type IAPIAction = (req: expressCore.Request) => unknown
export type IAAPIAction = (req: expressCore.Request) => Promise<M.SafeReturn<unknown>>

// Action Interface
export interface IAction {
  readonly name: string,
  readonly condition?: TAExec,
  readonly do: TAExec
}

// ##########################################################################################################################

// Sent Message Interface
export interface IMessage extends Message {
  send(p: { content?: string, log?: string, options?: MessageSendOptions }): Promise<IMessage>
  clean(): string
  readonly wapp: Wapp
  readonly on: {
    reply(fun: TExec): boolean
  }
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
