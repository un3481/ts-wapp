/*
##########################################################################################################################
#                                                            CHAT                                                        #
##########################################################################################################################
*/
/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/
// Defines Chat Object
export default class Chat {
  bot;
  constructor(bot) {
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
  }
  // Cycle Reference
  get chat() {
    return this;
  }
  get misc() {
    return this.bot.misc;
  }
  // Clean Message
  clean(message, lower = true) {
    const is = this.misc.guards.is;
    let str = '';
    if (is.string(message))
      str = message;
    else
      str = message.body;
    str = lower ? str.toLowerCase() : str;
    str = str.replace(`@${this.bot.wapp.me.user}`, '');
    while (str.includes('  '))
      str = str.replace('  ', ' ');
    str = str.trim();
    str = str.normalize('NFD');
    str = str.replace(/[\u0300-\u036f]/g, '');
    return str;
  }
  /*
  ##########################################################################################################################
  #                                                       CHAT GETTERS                                                     #
  ##########################################################################################################################
  */
  get timeGreet() {
    const h = new Date().getHours();
    const g = {
      6: 'Bom dia 🥱',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    };
    for (const i in g) {
      if (h < Number(i)) {
        return g[i];
      }
    }
  }
  get hi() {
    return this.misc.sets.rand(['Opa!!', 'Ola!', 'Oi!']);
  }
  get done() {
    return this.misc.sets.rand(['Pronto!', 'Certo!', 'Ok!']);
  }
  get gotIt() {
    const hi = this.misc.sets.rand([this.chat.hi, this.chat.hi, '']);
    const git = this.misc.sets.rand(['é pra já! 👍', 'entendido! 👍', 'Ok! 👍',
      'como desejar! 👍', 'deixa comigo! 👍', 'pode deixar! 👍'
    ]);
    // Assembly
    return this.misc.string.join([
      hi, (hi === '' ? '' : ' '), this.timeGreet, ', ', git
    ], '');
  }
  get gotMention() {
    const ack = this.misc.sets.rand(['🙋‍♂️', '😁']);
    const me = this.misc.sets.rand(['Eu', 'Aqui']);
    // Assembly
    return this.misc.string.join([ack, ' ', me], '');
  }
  get askPython() {
    const chat = this;
    const misc = this.misc;
    return {
      get asking() {
        const hi = misc.sets.rand([chat.hi, chat.hi, '']);
        const wait = misc.sets.rand([
          ', certo', ', espera um pouquinho', '',
          ', só um momento', ', Ok', ', um instante'
        ]);
        const lure = misc.sets.rand([
          'vou verificar o que você está querendo 🤔',
          'vou analisar melhor o que você pediu 🤔',
          'vou analisar aqui o que você está querendo 🤔',
          'vou procurar aqui o que você pediu 🤔'
        ]);
        // Assembly
        return misc.string.join([
          hi, (hi === '' ? '' : ' '), chat.timeGreet, wait, ', ', lure
        ], '');
      },
      get finally() {
        return misc.sets.rand([
          'Veja o que eu encontrei 👇', 'Eu encontrei o seguinte 👇',
          'Olha aí o que achei pra você 👇', 'Isso foi o que eu encontrei 👇',
          'Olha só o que eu encontrei 👇', 'Eu encontrei isso aqui 👇'
        ]);
      }
    };
  }
  get error() {
    const misc = this.misc;
    return {
      get network() {
        const msg = misc.sets.rand(['Ocorreu um erro enquanto eu buscava os dados!',
          'Oops, algo deu Errado!', 'Não pude acessar os dados!'
        ]);
        const flt = misc.sets.rand(['🤔 deve ter algum sistema fora do ar',
          '🤔 meus servidores devem estar offline',
          '🤔 deve ter caido alguma conexão minha'
        ]);
        // Assembly
        return misc.string.join([msg, ' ', flt], '');
      }
    };
  }
}
