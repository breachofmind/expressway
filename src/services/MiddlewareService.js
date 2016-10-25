"use strict";

var Expressway  = require('expressway');
var app         = Expressway.instance.app;
var _           = require('lodash');

var [log,controllerService,debug] = app.get('log','controllerService','debug');

/**
 * Service for handling the global middleware stack for express.
 * @author Mike Adamczyk <mike@bom.us>
 * @constructor
 */
class MiddlewareService
{
    constructor()
    {
        this.queue = [];
    }

    /**
     * Add middleware to the stack.
     * @param name string middleware name
     * @param func function optional
     * @returns {MiddlewareService}
     */
    add(name, func)
    {
        if (! func) func = controllerService.getMiddleware(name);
        this.queue.push( func );
        return this;
    }

    /**
     * Remove a middleware by name.
     * @param name string
     * @returns {boolean}
     */
    remove(name)
    {
        this.queue = _.filter(this.queue, object => {
            return object.name.toLowerCase() !== name.toLowerCase();
        });
        return true;
    }

    /**
     * Load any middleware in the stack.
     * @returns {Array}
     */
    load()
    {
        return this.queue.map( middleware => {
            return this.use(middleware);
        });
    }

    /**
     * Call the middleware function or boot() method.
     * @param middleware string|Middleware
     */
    use(middleware)
    {
        if (typeof middleware == 'string') middleware = controllerService.getMiddleware(middleware);

        if (middleware instanceof Expressway.Middleware) {
            app.call(middleware,'boot');
        } else {
            app.call(middleware);
        }
    }
}

module.exports = MiddlewareService;