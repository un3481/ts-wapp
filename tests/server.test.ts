import { CheckBool, Extends } from 'ts-misc/dist/modules/types';
import type { Server } from '../src/index';
import type { Client, Message } from 'whatsapp-web.js';

describe('test Server[WAWeb.Client]', () => {

  test('test Server[WAWeb.Client] Client type', () => {
    type ServerWAWeb = Server<Client>;
    type Verify = CheckBool<
        Extends<
            ServerWAWeb['core']['client'],
            Client
        >
    >;
    const verified: Verify = true;

    expect( verified ).toBe( true );
  });

  test('test Server[WAWeb.Client] Message type', () => {
    type ServerWAWeb = Server<Client>;
    type Verify = CheckBool<
        Extends<
            ReturnType<ServerWAWeb['core']['client']['sendMessage']>,
            Promise<Message>
        >
    >;
    const verified: Verify = true;

    expect( verified ).toBe( true );
  });
})