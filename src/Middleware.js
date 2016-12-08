"use strict";

var Expressway = require('expressway');
var app = Expressway.app;

class Middleware
{
    constructor()
    {
        /**
         * The name of the middleware.
         * @type {String}
         */
        this.name = this.constructor.name;
    }

    /**
     * The method to return to express.
     * This function can have services injected in it.
     * @param request
     * @param response
     * @param next
     */
    method(request,response,next)
    {
        throw new Error(`${this.name}.method() is unimplemented`);
    }

    /**
     * Register the middleware with express.
     * Should return a function that express can use:
     * function(request,response,next) {...}
     * @param $module Module
     * @returns {Function}
     */
    dispatch($module)
    {
        var self = this;

        function middleware(request,response,next)
        {
            if (response.headersSent) return null;

            response.$route = middleware.$route;

            let val = app.call(self,'method', [request,response,next]);

            if (val) return response.smart(val);
        }

        middleware.$route = this.name;

        return middleware;
    }
}


module.exports = Middleware;