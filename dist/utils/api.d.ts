import type Bot from '../index.js';
import type * as expressCore from 'express-serve-static-core';
import type {
  AxiosResponse
} from 'axios';
import type {
  IAPIAction,
  IAAPIAction
} from './types.js';
export default class API {
  bot: Bot;
  auth: string;
  app: expressCore.Express;
  actions: Record < string, IAAPIAction > ;
  constructor(bot: Bot);
  get api(): this;
  get misc(): import("ts-misc").default;
  get axios(): import("axios").AxiosStatic;
  req(url: string, data: any): Promise < AxiosResponse < any >> ;
  reqs(url: string, data: any): Promise < [AxiosResponse < any > , Error] > ;
  start(port: number): Promise < boolean > ;
  execute(req: expressCore.Request): Promise < {
    done: boolean;
    data: unknown;
    error ? : undefined;
  } | {
    done: boolean;
    error: any;
    data ? : undefined;
  } > ;
  add(name: string, func: IAPIAction): boolean;
}
