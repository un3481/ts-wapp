import { CheckBool, Extends } from 'ts-misc/dist/modules/types';
import type { Server } from '../src/index';
import type { Client } from 'whatsapp-web.js';

describe('test Server[WAWeb.Client]', () => {

  test('test Server[WAWeb.Client] types', () => {
    type ServerWAWeb = Server<Client>;
    type Verify = CheckBool<
        Extends<
            ServerWAWeb['core']['client'],
            Client
        >
    >;
    const verified: Verify = true;
    if (!verified) throw new Error('types don\'t match');
  });
})