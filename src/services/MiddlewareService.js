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
        this.stack = [];
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
        this.stack.push( func );
        return this;
    }

    /**
     * Remove a middleware by name.
     * @param name string
     * @returns {boolean}
     */
    remove(name)
    {
        this.stack = _.filter(this.stack, object => {
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
        return this.stack.map( middleware => {
            return this.use(middleware);
        });
    }

    use(middleware)
    {
        if (typeof middleware == 'string') middleware = controllerService.getMiddleware(middleware);

        if (middleware instanceof Expressway.Middleware) {
            app.call(middleware,'boot');
        } else {
            app.call(middleware);
        }
        debug(this, "Using Middleware: %s", middleware.name);
    }
}

module.exports = MiddlewareService;