"use strict";

var Expressway = require('expressway');

class Middleware
{
    constructor()
    {
        this.name = this.constructor.name;
        this.order = 0;

        this.dispatch.$route = this.name;
    }

    /**
     * Register the middleware with express.
     */
    dispatch(request,response,next)
    {
        throw new Error("Middleware.dispatch() unimplemented");
    }

    load(express)
    {
        express.use(this.dispatch.bind(this));
    }
}


module.exports = Middleware;