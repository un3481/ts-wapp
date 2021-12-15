/*
##########################################################################################################################
#                                                        TS-WAPP                                                         #
##########################################################################################################################
#                                                                                                                        #
#                                             HTTP Rest API for Whatsapp Bot                                             #
#                                                    Author: Anthony                                                     #
#                                 ---------------- Python3 --- NodeJS ----------------                                   #
#                                                 * Under Development *                                                  #
#                                       https://github.com/melon-yellow/ts-wapp                                        #
#                                                 Powered by venom-bot                                                   #
#                                                                                                                        #
##########################################################################################################################
#                                                        BOT CORE                                                        #
##########################################################################################################################
*/

// Import Miscellaneous
import Wapp from './utils/wapp.js'
import Chat from './utils/chat.js'
import Network from './utils/network.js'

// Miscellaneous Type
import Miscellaneous from 'ts-misc'

// New Miscellaneous Object
const misc = new Miscellaneous()

/*
##########################################################################################################################
#                                                         BOT CLASS                                                      #
##########################################################################################################################
*/

// Bot Class
export default class Bot<N extends string = string> {
  name: N
  misc: Miscellaneous
  network: Network
  wapp: Wapp
  chat: Chat

  constructor (name: N) {
    // Set Bot Name
    this.name = name
    // Get Miscellaneous Methods
    this.misc = misc

    // Nest Objects
    this.wapp = new Wapp(this)
    this.network = new Network(this)
    this.chat = new Chat(this)

    // Add else Method to Bot
    this.bot.add({
      action: 'else',
      do: msg => null
    })
  }

  /*
  ##########################################################################################################################
  #                                                      BOT METHODS                                                       #
  ##########################################################################################################################
  */

  // Cycle Reference
  get bot() { return this }

  // Saves Log
  async log(log: string | Error): Promise<void> {
    return this.misc.logging.log(log)
  }

  /*
  ##########################################################################################################################
  #                                                      START METHOD                                                      #
  ##########################################################################################################################
  */

  // Host Device
  get me() {
    return this.wapp.client.me
  }

  // Start App
  async start(): Promise<boolean> {
    // Start Wapp Services
    await this.wapp.start(this.bot.name)
    // Check Started
    if (!this.wapp.started) throw new Error('bot not started')
    // Start Network API
    this.network.assign()
    // Log Start of Bot
    await this.bot.log(`${this.bot.name}::started`)
    // return status
    return this.wapp.started
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Message Method
  get send(): typeof Wapp.prototype.send {
    return this.wapp.send.bind(this.wapp)
  }

  // Send Message Safe Method
  get sends(): typeof Wapp.prototype.sends {
    return this.wapp.sends.bind(this.wapp)
  }

  // Add Action
  get add(): typeof Wapp.prototype.add {
    return this.wapp.add
  }
}

/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
