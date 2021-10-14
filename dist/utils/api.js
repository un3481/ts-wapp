/*
##########################################################################################################################
#                                                        AVBOT CORE                                                      #
##########################################################################################################################
*/
// Import Express
import express from 'express';
import basicAuth from 'express-basic-auth';
import requestIp from 'request-ip';
// Import General Modules
import axios from 'axios';
/*
##########################################################################################################################
#                                                           API CLASS                                                    #
##########################################################################################################################
*/
// API Class
export default class API {
  bot;
  auth;
  app;
  actions;
  constructor(bot) {
    Object.defineProperty(this, 'bot', {
      get() {
        return bot;
      }
    });
    // Interface Actions Object
    this.actions = {};
    // Set Authentication
    this.auth = 'ert2tyt3tQ3423rubu99ibasid8hya8da76sd';
    // Define App
    this.app = express();
    this.app.use(basicAuth({
      users: {
        bot: this.auth
      }
    }));
    this.app.use(express.json());
    // Set Bot Interface
    this.app.post('/bot', async (req, res) => {
      // Execute Functionality
      const response = await this.api.execute(req);
      // Send Response
      res.send(JSON.stringify(this.misc.sets.serialize(response)));
    });
  }
  /*
  ##########################################################################################################################
  #                                                          API METHODS                                                   #
  ##########################################################################################################################
  */
  // Cycle Reference
  get api() {
    return this;
  }
  get misc() {
    return this.bot.misc;
  }
  get axios() {
    return axios;
  }
  // Request
  async req(url, data) {
    return axios.post(url, this.misc.sets.serialize(data), {
      auth: {
        username: 'bot',
        password: this.auth
      }
    });
  }
  // Safe Request
  async reqs(url, data) {
    const req = this.misc.handle.safe(this.req, this);
    return req(url, data);
  }
  // Start Interface App
  async start() {
    try {
      // listen on port 1615
      this.app.listen(1615);
      // if error occurred
    } catch {
      return false;
    }
    // return success
    return true;
  }
  /*
  ##########################################################################################################################
  #                                                    API EXECUTION METHODS                                               #
  ##########################################################################################################################
  */
  // Interface Execute Bot Command
  async execute(req) {
    let action;
    try {
      const is = this.misc.guards.is;
      // check request
      if (!is.object(req))
        throw new Error('bad request');
      if (!is.object(req.body))
        throw new Error('bad request');
      if (!is.in(req.body, 'action'))
        throw new Error('key "action" missing in request');
      if (!is.string(req.body.action))
        throw new Error('key "action" must be a string');
      if (req.body.action.length === 0)
        throw new Error('key "action" not valid');
      if (!is.in(this.actions, req.body.action))
        throw new Error('action not found');
      // update reference
      action = req.body.action;
      // log action to be executed
      const ip = requestIp.getClientIp(req).replace('::ffff:', '');
      await this.bot.log(`Exec(api::${action}) From(${ip})`);
      // execute action
      const [data, actionError] = await this.actions[action](req);
      // throw action error
      if (actionError)
        throw actionError;
      // resolve with data
      return {
        done: true,
        data: data
      };
      // if error occurred
    } catch (error) {
      // log error
      if (action)
        await this.bot.log(`Throw(api::${action}) Catch(${error})`);
      // reject with error
      return {
        done: false,
        error: error
      };
    }
  }
  // Add Bot Interface Action
  add(name, func) {
    const is = this.misc.guards.is;
    // Check Inputs
    if (!is.function(func))
      return false;
    if (!is.string(name))
      return false;
    if (name.length === 0)
      return false;
    this.actions[name] = this.misc.handle.safe(func);
    return true;
  }
}
