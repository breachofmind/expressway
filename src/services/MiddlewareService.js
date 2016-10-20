"use strict";

var Expressway  = require('expressway');
var app         = Expressway.instance.app;
var debug       = app.get('debug');
var _           = require('lodash');

class MiddlewareService
{
    constructor()
    {
        this.stack = [];
    }

    /**
     * Add a new stack.
     * @param name string
     * @param func function
     * @returns {MiddlewareService}
     */
    add(name, func)
    {
        this.stack.push( new Stack(name,func) );
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
        return this.stack.map( item =>
        {
            app.call(item,'load');

            return item.name;
        });
    }
}

/**
 * A stack object.
 */
class Stack
{
    /**
     * Create a new Stack middleware
     * @param name string
     * @param middleware function
     */
    constructor(name, middleware)
    {
        this.name       = name;
        this.middleware = middleware;
        this.loaded     = false;
    }

    /**
     * Load the middleware into express.
     * @param express Express
     * @returns {null|boolean}
     */
    load(express)
    {
        if (this.loaded) return null;

        debug('MiddlewareService', 'Adding Application Middleware: %s', this.name);
        app.call(this,'middleware', [app,express]);

        return this.loaded = true;
    }
}

module.exports = MiddlewareService;