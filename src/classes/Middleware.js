"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;

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
        throw new Error("Middleware.method() is unimplemented");
    }

    /**
     * Register the middleware with express.
     * @returns {Function}
     */
    dispatch()
    {
        var self = this;

        function middleware(request,response,next)
        {
            if (response.headersSent) return null;

            return app.call(self,'method', [request,response,next]);
        }

        middleware.$route = this.name;

        return middleware;
    }

    /**
     * When loading middleware globally, this method can be used
     * to load middleware into express via express.use().
     * @param $app Express
     * @returns {null}
     */
    boot($app)
    {
        $app.use( this.dispatch() );
    }
}


module.exports = Middleware;