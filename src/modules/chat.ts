
// ##########################################################################################################################

// Import Misc Modules
import { is, sets, strings } from 'ts-misc'
import type * as M from 'ts-misc/dist/utils/types'

// Import Modules
import type Wapp from './wapp'
import type { IMessage } from './types'

// ##########################################################################################################################

// Defines Chat Object
export default class Chat {
  wapp: Wapp

  constructor (wapp: Wapp) {
    Object.defineProperty(this, 'wapp',
      { get() { return wapp } }
    )
  }

  // Clean Message
  clean(message: string | IMessage, lower = true): string {
    let str: string = ''
    if (is.string(message)) str = message
    else str = message.body
    str = lower ? str.toLowerCase() : str
    str = str.replace(`@${this.wapp.me.user}`, '')
    while (str.includes('  ')) str = str.replace('  ', ' ')
    str = str.trim()
    str = str.normalize('NFD')
    str = str.replace(/[\u0300-\u036f]/g, '')
    return str
  }

  // ##########################################################################################################################

  get timeGreet() {
    const h = new Date().getHours()
    const g = {
      6: 'Bom dia 🥱',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    } as const
    for (const i in g) {
      if (h < Number(i)) {
        return g[i] as M.ValueOf<typeof g>
      }
    }
  }

  get hi() {
    return sets.rand(['Opa!!', 'Ola!', 'Oi!'] as const)
  }

  get done() {
    return sets.rand(['Pronto!', 'Certo!', 'Ok!'] as const)
  }

  get gotIt() {
    const hi = sets.rand([this.hi, this.hi, ''] as const)
    const git = sets.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ] as const)
    // Assembly
    return strings.join([
      hi, (hi === '' ? '' : ' '), this.timeGreet, ', ', git
    ] as const, '')
  }

  get gotMention() {
    const ack = sets.rand(['🙋‍♂️', '😁'] as const)
    const me = sets.rand(['Eu', 'Aqui'] as const)
    // Assembly
    return strings.join([ack, ' ', me] as const, '')
  }
}

// ##########################################################################################################################
