/*
##########################################################################################################################
#                                               WAPP - WHATSAPP APPLICATION                                              #
##########################################################################################################################
#                                                                                                                        #
#                                                      Wapp v2.1.3                                                       #
#                                          Multi-language API for Whatsapp Bot                                           #
#                                 ---------------- Python3 --- NodeJS ----------------                                   #
#                                             This is a Development Server                                               #
#                                                 Powered by venom-bot                                                   #
#                                                                                                                        #
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/
// Import Miscellaneous
import Wapp from './utils/wapp.js';
import Chat from './utils/chat.js';
import API from './utils/api.js';
// Miscellaneous Type
import Miscellaneous from 'ts-misc';
// New Miscellaneous Object
const misc = new Miscellaneous();
/*
##########################################################################################################################
#                                                         BOT CLASS                                                      #
##########################################################################################################################
*/
// Bot Class
export default class Bot {
  misc;
  actions;
  started;
  wapp;
  chat;
  api;
  constructor() {
    // Get Miscellaneous Methods
    this.misc = misc;
    // Bot Properties
    this.started = false;
    // Set Lists
    this.actions = {};
    // Nest Objects
    this.wapp = new Wapp(this);
    this.chat = new Chat(this);
    this.api = new API(this);
    // Add else Method to Bot
    this.bot.add('else', msg => null);
    // Add send_msg Action
    this.api.add('send_msg', async (req) => {
      // fix parameters
      const to = req.body.to || 'anthony';
      const text = req.body.text || 'empty message';
      const log = req.body.log || 'api::send_msg';
      const quoteId = req.body.quote_id || null;
      const replyUrl = req.body.reply_url || null;
      // send message
      const [sent, sendMessageError] = await this.bot.sends(to, text, log, quoteId);
      // if not done prevent execution
      if (sendMessageError)
        throw sendMessageError;
      // set default reply action
      sent.onReply(async (message) => {
        const json = {
          action: 'on_reply',
          msg_id: sent.id,
          reply: message
        };
        const [data, onReplyError] = await this.api.reqs(replyUrl, json);
        if (onReplyError)
          throw onReplyError;
        return data;
      });
      // return message
      return sent;
    });
    // Add get_message Action
    this.api.add('get_message', async (req) => {
      const is = this.misc.guards.is;
      // Check Inputs
      if (!is.in(req.body, 'id'))
        throw new Error('key "id" missing in request');
      if (!is.string(req.body.id))
        throw new Error('key "id" must be a string');
      if (req.body.id.length === 0)
        throw new Error('key "id" not valid');
      return this.wapp.getMessageById(req.body.id);
    });
    // Add host_device Action
    this.api.add('host_device', async (req) => this.wapp.client.getHostDevice());
  }
  /*
  ##########################################################################################################################
  #                                                      BOT METHODS                                                       #
  ##########################################################################################################################
  */
  // Cycle Reference
  get bot() {
    return this;
  }
  // Saves Log
  async log(log) {
    // Structure
    const t = this.misc.sync.timestamp();
    console.log(`(${t}) ${log}`);
  }
  /*
  ##########################################################################################################################
  #                                                      START METHOD                                                      #
  ##########################################################################################################################
  */
  // Start App
  async start(session) {
    // Start Wapp Services
    this.bot.started = await this.wapp.start(session);
    if (!this.bot.started)
      return false;
    // Log Start of Bot
    await this.bot.log('Avbot::Started');
    // Send Message to Admin
    await this.bot.sends('anthony', 'Node Avbot Started!', 'bot_start');
    // Start Interface App
    await this.bot.api.start();
    // return status
    return this.bot.started;
  }
  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */
  // Send Message Method
  get send() {
    return this.wapp.send.bind(this.wapp);
  }
  get sends() {
    return this.wapp.sends.bind(this.wapp);
  }
  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */
  // Execute Bot Command
  async execute(message) {
    // set initial
    let actionName;
    const logAction = (action) => {
      actionName = action.name;
      return this.bot.log(`Exec(bot::${action.name}) From(${message.from})`);
    };
    try {
      // Check All Action Conditions
      for (const action of Object.values(this.bot.actions)) {
        if (action.cond && action.name !== 'else') {
          const [cond, condError] = await action.cond(message);
          if (cond && !condError) {
            await logAction(action);
            const [data, actionError] = await action.do(message);
            if (actionError)
              throw actionError;
            else
              return data;
          }
        }
      }
      // do Else
      const elseAction = this.bot.actions.else;
      await logAction(elseAction);
      const [data, actionError] = await elseAction.do(message);
      if (actionError)
        throw actionError;
      else
        return data;
      // if error occurred
    } catch (error) {
      // log error
      await this.bot.log(`Throw(bot::${actionName}) Catch(${error})`);
    }
  }
  // Add Bot Action
  add = (name, exec, success) => {
    const is = this.misc.guards.is;
    // Check Inputs
    if (!is.function(exec))
      return false;
    if (success && !is.function(success))
      return false;
    if (!is.string(name))
      return false;
    if (name.length === 0)
      return false;
    // Execute Action
    let action;
    action = {
      name: name,
      cond: this.misc.handle.safe(exec),
      do: this.misc.handle.safe(success)
    };
    if (name === 'else') {
      action = {
        name: name,
        do: this.misc.handle.safe(exec)
      };
    }
    this.actions[name] = action;
    return true;
  };
}
/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
