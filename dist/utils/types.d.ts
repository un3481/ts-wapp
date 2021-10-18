import type Venom from 'venom-bot';
import type Wapp from './wapp.js';
import type * as expressCore from 'express-serve-static-core';
import type * as M from 'ts-misc/dist/utils/handle';
export declare type TExec = (m: ISent) => unknown;
export declare type TAExec = (m: ISent) => M.TSafeAsyncReturn < unknown > ;
export declare type IAPIAction = (req: expressCore.Request) => unknown;
export declare type IAAPIAction = (req: expressCore.Request) => M.TSafeAsyncReturn < unknown > ;
export interface IAction {
  readonly name: string;
  cond ? : TAExec;
  do :TAExec;
}
export declare type TFetchString = string | Promise < string > | (() => string | Promise < string > );
export interface ISent extends Venom.Message {
  readonly wapp: Wapp;
  readonly quotedMsg: ISent | undefined;
  send(msg: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  quote(msg: TFetchString, log ? : TFetchString): Promise < ISent > ;
  onReply(exec: TExec): boolean;
  clean(): string;
}
export interface ISentTextObj {
  to: {
    _serialized: string;
  };
}
export interface ITarget {
  readonly addr: string;
  readonly auth: {
    readonly user: string;
    readonly password: string;
  };
}
