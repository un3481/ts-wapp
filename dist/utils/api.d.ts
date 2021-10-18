import type Bot from '../index.js';
import type * as expressCore from 'express-serve-static-core';
import type {
  AxiosResponse
} from 'axios';
import type {
  IAPIAction,
  IAAPIAction,
  ITarget
} from './types.js';
export default class API {
  bot: Bot;
  auth: string;
  app: expressCore.Express;
  actions: Record < string, IAAPIAction > ;
  config: {
    port: number;
    auth: {
      user: string;
      passwd: string;
    };
  };
  constructor(bot: Bot);
  get api(): this;
  get misc(): import("ts-misc").default;
  get axios(): import("axios").AxiosStatic;
  port(port: number): API;
  user(user: string): API;
  password(passwd: string): API;
  req(target: ITarget, data: any): Promise < AxiosResponse < any >> ;
  reqs(target: ITarget, data: any): Promise < [AxiosResponse < any > , Error] > ;
  start(): Promise < boolean > ;
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
