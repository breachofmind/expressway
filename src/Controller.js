"use strict";

var Expressway          = require('expressway');
var app                 = Expressway.instance.app;
var utils               = Expressway.utils;
var _                   = require('lodash');
var controllerService   = app.get('controllerService');
var stack               = require('callsite');

/**
 * Controller class.
 * Handles organization of Model/Data logic and routing.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Controller
{
    constructor()
    {
        this.name = this.constructor.name;

        this._middleware = [];
    }

    /**
     * Attach middleware to a method or to all methods.
     * Normally called in the boot function when declaring a controller.
     * This needs to occur only after all controllers have been loaded, in the
     * event that a controller method is used as middleware (like indexController.index)
     *
     * @param method string|function|array
     * @param stack function|array
     * @returns {Controller}
     */
    middleware(method, stack)
    {
        if (! method || !arguments.length) {
            return this;
        }

        if (typeof stack == 'undefined')
        {
            // method is a hash of object -> middlewares.
            if (typeof method == 'object')
            {
                Object.keys(method).forEach(route =>
                {
                    let stack = method[route];
                    this._middleware.push({method: route, middleware: stack})
                })

            } else {
                // "method" could be a string or function.
                // Assign middleware to all methods.
                this._middleware.push({method: "*", middleware: method});
            }

            // Assign middleware to a single method.
        } else if (typeof method == 'string') {
            this._middleware.push({method: method, middleware: stack})
        }

        return this;
    };

    /**
     * Bind a parameter to a middleware.
     * @param parameter string
     * @param handler function
     * @returns Controller
     */
    bind(parameter,handler)
    {
        function binding(request,response,next) {
            if (request.params.hasOwnProperty(parameter)) {
                return handler(request.params[parameter], request,response,next);
            }
            return next();
        }
        binding.$route = `binding[:${parameter}]`;
        return this.middleware(binding);
    };

    /**
     * Bind a GET query to a middleware.
     * @param parameter string
     * @param handler function
     * @returns Controller
     */
    query(parameter,handler)
    {
        function binding(request,response,next) {
            if (request.query.hasOwnProperty(parameter)) {
                return handler(request.query[parameter], request,response,next);
            }
            return next();
        }
        binding.$route = `binding[?${parameter}]`;
        return this.middleware(binding);
    };


    /**
     * Finds middleware required for the given route.
     * @param method {String}
     * @param action {Function}
     * @param $module Module
     * @returns {Array}
     */
    getMiddleware(method, action, $module)
    {
        var out = this._middleware.map(value =>
        {
            if (value.method == "*" || value.method == method)
                return controllerService.getRouteFunctions(value.middleware, $module);
        });

        // The last middleware in the stack is the actual request.
        if (action) out.push(action);

        return _.compact(out);
    };

    /**
     * Dispatches the middleware and route stack.
     * Returns an array suitable for use with express.
     * ie, router.get(urlpattern, array)
     * @param method {String}
     * @param $module Module
     * @returns {Array}
     */
    dispatch(method,$module)
    {
        var self = this;

        if (! typeof this[method] === 'function') {
            throw new Error(`"${this.name}" missing method "${method}"`);
        }

        function route(request,response,next)
        {
            response.$route = route.$route;

            if (response.headersSent) return null;

            // Allows the injection of services into a controller method.
            // The first 3 arguments are always the request/response/next params.
            var output = app.call(self, method, [request,response,next]);

            return response.smart(output);
        }

        route.$route = this.name+"."+method;

        return this.getMiddleware(method, route, $module);
    }
}

module.exports = Controller;