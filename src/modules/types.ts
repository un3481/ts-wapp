
// ##########################################################################################################################

// Import Venom Type
import type Venom from 'venom-bot'
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device'

// Import Express-Core Type
import type * as expressCore from 'express-serve-static-core'

// Import Misc Types
import { is } from 'ts-misc'
import type * as M from 'ts-misc/dist/modules/handle'

// Import Wapp Type
import type Wapp from './wapp'

// ##########################################################################################################################

// Exec Function Type
export type TExec = (m: IMessage) => unknown
export type TAExec = (m: IMessage) => M.TSafeAsyncReturn<unknown>

// Interface Action Interface
export type IAPIAction = (req: expressCore.Request) => unknown
export type IAAPIAction = (req: expressCore.Request) => M.TSafeAsyncReturn<unknown>

// Action Interface
export interface IAction {
  readonly name: string,
  readonly condition?: TAExec,
  readonly do: TAExec
}

// ##########################################################################################################################

// Message Text Type
export type TFetchString = string | Promise<string> | (() => string | Promise<string>)

// ##########################################################################################################################

// Sent Message Interface
export interface IMessage extends Venom.Message {
  readonly wapp: Wapp
  readonly quotedMsg: IMessage | undefined
  send(p: { text?: TFetchString, log?: TFetchString, quote?: TFetchString }): Promise<IMessage>
  quote(p: { text?: TFetchString, log?: TFetchString }): Promise<IMessage>
  clean(): string
  on: {
    reply(exec: TExec): boolean
  }
}

// Sent Text Object
export interface IMessageTextObj {
  to: { _serialized: string }
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

export interface WappHostDevice extends VenomHostDevice.Me {
  session: string
}

// ##########################################################################################################################
