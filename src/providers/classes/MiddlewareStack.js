"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var debug = app.get('debug');

class MiddlewareStack
{
    constructor()
    {
        this.stack = [];
    }

    /**
     * Add a new stack.
     * @param name string
     * @param func function
     * @returns {MiddlewareStack}
     */
    add(name, func)
    {
        this.stack.push( new Stack(name,func) );
        return this;
    }

    /**
     * Load any middleware in the stack.
     * @param server
     * @returns {Array}
     */
    load(server)
    {
        return this.stack.map(function(item) {

            if (item.loaded) return;

            debug(this, 'Adding Application Middleware: %s', item.name);
            item.func(app, server);
            item.loaded = true;

            return item.name;

        }.bind(this));
    }
}

class Stack
{
    constructor(name, func)
    {
        this.name = name;
        this.func = func;
        this.loaded = false;
    }
}

module.exports = MiddlewareStack;