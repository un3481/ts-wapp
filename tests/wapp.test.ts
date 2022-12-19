import { CheckBool, Extends } from 'ts-misc/dist/modules/types';
import type { Wapp } from '../src/index';
import type { Client, Message } from 'whatsapp-web.js';

describe('test Wapp[WAWeb.Client]', () => {

  test('test Wapp[WAWeb.Client] types', () => {
    type WappWAWeb = Wapp<Client>;
    type Verify = CheckBool<
        Extends<
            ReturnType<WappWAWeb['client']['sendMessage']>,
            Promise<Message>
        >
    >;
    const verified: Verify = true;
    if (!verified) throw new Error('types don\'t match');
  });
})
