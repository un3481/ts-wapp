
// ##########################################################################################################################

// Import Misc Modules
import { is, sets, strings } from 'ts-misc'
import type { ValueOf } from 'ts-misc/dist/modules/types'

// Import Modules
import type { MessageLike } from './types'

// ##########################################################################################################################

// Clean Message
export const clean = (
  message: string | MessageLike,
  options: {
    lower?: boolean,
    user?: string
  }
): string => {
  let body: string = (
    is.string(message)
      ? message
      : message.body
  )
  body = options.lower ? body.toLowerCase() : body
  body = options.user ? body.replace(`@${options.user}`, '') : body
  while (body.includes('  ')) body = body.replace('  ', ' ')
  body = body.trim()
  body = body.normalize('NFD')
  body = body.replace(/[\u0300-\u036f]/g, '')
  return body
}

// ##########################################################################################################################

export const greet = {
  get hi() {
    return sets.rand(['Opa!!', 'Ola!', 'Oi!'] as const)
  },
  get time() {
    const h = new Date().getHours()
    const g = {
      6: 'Bom dia 🥱',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    } as const
    for (const i in g) {
      if (h < Number(i)) {
        return g[i] as ValueOf<typeof g>
      }
    }
  }
}

// ##########################################################################################################################

export const got = {
  get done() {
    return sets.rand(['Pronto!', 'Certo!', 'Ok!'] as const)
  },
  get mention() {
    const ack = sets.rand(['🙋‍♂️', '😁'] as const)
    const me = sets.rand(['Eu', 'Aqui'] as const)
    // Assembly
    return strings.join([ack, ' ', me] as const, '')
  },
  get order() {
    const hi = sets.rand([greet.hi, greet.hi, ''] as const)
    const git = sets.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ] as const)
    // Assembly
    return strings.join([
      hi, (hi === '' ? '' : ' '), greet.time, ', ', git
    ] as const, '')
  }
}

// ##########################################################################################################################

export const reply = {
  async mention<M extends MessageLike>(message: M) {
    return await message.reply(got.mention)
  }
}

// ##########################################################################################################################
