
// ##########################################################################################################################

// Import Misc Types
import { is } from 'ts-misc'
import type { TypeGuard } from 'ts-misc/dist/modules/types'
import type { SafeReturn } from 'ts-misc/dist/modules/handles'

// ##########################################################################################################################

// On-Message Function Type
export type TriggerCall<A, R> = (a: A) => R | Promise<R>

// On-Message Trigger Interface
export interface Trigger<A> {
  readonly name: string,
  readonly condition?: TriggerCall<A, SafeReturn<boolean>>,
  readonly fun: TriggerCall<A, SafeReturn<unknown>>
}

// ##########################################################################################################################

// Target Interface
export interface ITarget {
  readonly address: string
  readonly user: string
  readonly password: string
}

// Check Target Object
export const isTarget: TypeGuard<ITarget, []> = is({
  address: is.string,
  user: is.string,
  password: is.string
})

// ##########################################################################################################################

// MessageId Mock
interface MessageIdLike {
  _serialized: string
}

// Message Mock
interface MessageLike {
  author?: string,
  body: string,
  from: string,
  hasQuotedMsg: boolean,
  id: MessageIdLike,
  getQuotedMessage(): Promise<MessageLike>,
  reply(content: MessageContentLike, chatId?: string, options?: MessageSendOptionsLike): Promise<MessageLike>
}

// ##########################################################################################################################

// ContactId Mock
interface ContactIdLike {
  user: string
}

// ClientInfo Mock
interface ClientInfoLike {
  wid: ContactIdLike
}

// MessageContent Mock
type MessageContentLike = string

// MessageSendOptions Mock
interface MessageSendOptionsLike {}

// ##########################################################################################################################

// Client Mock
export interface ClientLike {
  info: ClientInfoLike,
  sendMessage(chatId: string, content: MessageContentLike, options?: MessageSendOptionsLike): Promise<MessageLike>
}

// ##########################################################################################################################
