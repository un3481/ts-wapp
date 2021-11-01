/*
##########################################################################################################################
#                                                        TS-WAPP                                                         #
##########################################################################################################################
#                                                                                                                        #
#                                             HTTP Rest API for Whatsapp Bot                                             #
#                                                    Author: Anthony                                                     #
#                                 ---------------- Python3 --- NodeJS ----------------                                   #
#                                                 * Under Development *                                                  #
#                                      https://github.com/anthony-freitas/ts-wapp                                        #
#                                                 Powered by venom-bot                                                   #
#                                                                                                                        #
##########################################################################################################################
#                                                        BOT CORE                                                        #
##########################################################################################################################
*/

// Import Miscellaneous
import Wapp from './utils/wapp.js'
import Chat from './utils/chat.js'
import API from './utils/api.js'

// Miscellaneous Type
import Miscellaneous from 'ts-misc'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

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
  wapp: Wapp
  chat: Chat
  api: API

  constructor (name: N) {
    // Set Bot Name
    this.name = name
    // Get Miscellaneous Methods
    this.misc = misc

    // Nest Objects
    this.wapp = new Wapp(this)
    this.chat = new Chat(this)
    this.api = new API(this)

    /*
    ##########################################################################################################################
    #                                                         BOT CLASS                                                      #
    ##########################################################################################################################
    */

    // Add else Method to Bot
    this.bot.add('else', msg => null)

    // Add send_msg Action
    this.api.add('send_msg',
      async req => {
        // get arguments
        const to = req.body.to
        const text = req.body.text
        const log = req.body.log
        const quoteId = req.body.quote_id
        // check arguments
        if (!is.string(to)) throw new Error('key "to" not valid')
        if (!is.string.or.null(text)) throw new Error('key "text" not valid')
        if (!is.string.or.null(log)) throw new Error('key "log" not valid')
        if (!is.string.or.null(quoteId)) throw new Error('key "quote_id" not valid')
        // fix parameters
        const p = {
          to: to,
          text: text || 'empty message',
          log: log || 'api::send_msg',
          quoteId: quoteId
        }
        // get referer
        const referer = req.body.referer || null
        // send message
        const [sent, sendMessageError] = await this.bot.sends(p)
        // if not done prevent execution
        if (sendMessageError) throw sendMessageError
        // set default reply action
        sent.onReply(async message => {
          const json = {
            action: 'on_reply',
            msg_id: sent.id,
            reply: message
          }
          const [data, onReplyError] = await this.api.reqs(referer, json)
          if (onReplyError) throw onReplyError
          return data
        })
        // return message
        return sent
      }
    )

    // Add get_message Action
    this.api.add('get_message',
      async req => {
        // Check Inputs
        if (!is.in(req.body, 'id')) throw new Error('key "id" missing in request')
        if (!is.string(req.body.id)) throw new Error('key "id" must be a string')
        if (req.body.id.length === 0) throw new Error('key "id" not valid')
        return this.wapp.getMessageById(req.body.id)
      }
    )

    // Add host_device Action
    this.api.add('host_device',
      async req => {
        const hd = await this.wapp.getHostDevice()
        return { ...hd, name: this.bot.name }
      }
    )
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
    // Structure
    const t = this.misc.sync.timestamp()
    console.log(`(${t}) ${log}`)
  }

  /*
  ##########################################################################################################################
  #                                                      START METHOD                                                      #
  ##########################################################################################################################
  */

  // Start App
  async start(): Promise<boolean> {
    // Start Wapp Services
    await this.wapp.start(this.bot.name)
    // Check Started
    if (!this.wapp.started) return false
    // Start Interface App
    await this.api.start()
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
  get send(): (typeof Wapp.prototype.send) {
    return this.wapp.send.bind(this.wapp)
  }

  // Send Message Safe Method
  get sends(): (typeof Wapp.prototype.sends) {
    return this.wapp.sends.bind(this.wapp)
  }

  // Add Action
  get add(): (typeof Wapp.prototype.add) {
    return this.wapp.add
  }
}

/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
