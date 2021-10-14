import Wapp from './utils/wapp.js';
import Chat from './utils/chat.js';
import API from './utils/api.js';
import type {
  IAction,
  TExec,
  ISent
} from './utils/types.js';
import Miscellaneous from 'ts-misc';
export default class Bot {
  misc: Miscellaneous;
  actions: Record < string, IAction > ;
  started: boolean;
  wapp: Wapp;
  chat: Chat;
  api: API;
  constructor();
  get bot(): this;
  log(log: string | Error): Promise < void > ;
  start(session: string): Promise < boolean > ;
  get send(): (typeof Wapp.prototype.send);
  get sends(): (typeof Wapp.prototype.sends);
  execute(message: ISent): Promise < any > ;
  add: < N extends string > (name: N, ...params: N extends 'else' ? [
    exec: TExec
  ] : [
    exec: TExec,
    success: TExec
  ]) => boolean;
}
