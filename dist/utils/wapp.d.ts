import Venom from 'venom-bot';
import type VenomHostDevice from 'venom-bot/dist/api/model/host-device';
import type Bot from '../index.js';
import type {
  TExec,
  TAExec,
  TFetchString,
  ISent,
  ISentTextObj
} from './types.js';
export declare class WhappTypeGuards {
  bot: Bot;
  constructor(bot: Bot);
  isSentTextObj(obj: unknown): obj is ISentTextObj;
}
export default class Wapp {
  bot: Bot;
  client: Venom.Whatsapp;
  me: VenomHostDevice.Me;
  started: boolean;
  contactsList: Record < string, string > ;
  replyables: Record < string, TAExec > ;
  typeGuards: WhappTypeGuards;
  constructor(bot: Bot);
  get wapp(): this;
  get misc(): import("ts-misc").default;
  start(session: string): Promise < boolean > ;
  onMessage(message: Venom.Message): Promise < any > ;
  onReply(message: ISent): Promise < import("ts-misc/dist/utils/handle").TSafeReturn < unknown >> ;
  addReplyable(sentId: string, exec: TExec): boolean;
  fetch(data: TFetchString): Promise < string > ;
  setContactsList(contactsList: Record < string, string > ): boolean;
  getContactByName(to: string, flag ? : number): string;
  getMessageById(id: string): Promise < ISent > ;
  setMessage(sent: Venom.Message): ISent;
  sendText(to: string, text: string): Promise < ISent > ;
  sendReply(to: string, text: string, quoteId: string): Promise < ISent > ;
  send(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < ISent > ;
  sends(to: TFetchString, text: TFetchString, log ? : TFetchString, quoteId ? : TFetchString): Promise < [ISent, Error] > ;
}
