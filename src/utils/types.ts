
// Import Venom Type
import type Venom from 'venom-bot'

// Import Wapp Class
import type Wapp from './wapp.js'

// Import Express-Core Type
import type * as expressCore from 'express-serve-static-core'

// Import Types
import type * as M from 'ts-misc/dist/utils/handle'

// Exec Function Type
export type TExec = (m: ISent) => unknown
export type TAExec = (m: ISent) => M.TSafeAsyncReturn<unknown>

// Interface Action Interface
export type IAPIAction = (req: expressCore.Request) => unknown
export type IAAPIAction = (req: expressCore.Request) => M.TSafeAsyncReturn<unknown>

// Action Interface
export interface IAction {
  readonly name: string,
  cond?: TAExec,
  do: TAExec
}

// Message Text Type
export type TFetchString = string | Promise<string> | (() => string | Promise<string>)

// Sent Message Interface
export interface ISent extends Venom.Message {
  readonly wapp: Wapp
  readonly quotedMsg: ISent | undefined
  send(msg: TFetchString, log?: TFetchString, quoteId?: TFetchString): Promise<ISent>
  quote(msg: TFetchString, log?: TFetchString): Promise<ISent>
  onReply(exec: TExec): boolean
  clean(): string
}

// Sent Text Object
export interface ISentTextObj {
  to: { _serialized: string }
}

// Target Interface
export interface ITarget {
  readonly addr: string
  readonly auth: {
    readonly user: string
    readonly password: string
  }
}
