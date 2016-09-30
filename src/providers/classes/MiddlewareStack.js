"use strict";

class MiddlewareStack
{
    constructor(app)
    {
        this.app = app;
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
        var log = this.app.get('log');

        return this.stack.map(function(item) {

            if (item.loaded) return;

            log.debug('[Express] Adding Application Middleware: %s', item.name);
            item.func(this.app, server);
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