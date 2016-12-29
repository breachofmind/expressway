"use strict";

var _     = require('lodash');
var utils = require('./support/utils');

/**
 * Controller class.
 * Handles organization of Model/Data logic and routing.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Controller
{
    constructor(app)
    {
        /**
         * Application instance.
         * @type Application
         */
        this.app = app;

        /**
         * Route-specific middleware.
         * @type {Array}
         * @private
         */
        this._middleware = [];

        /**
         * Defaults styles, scripts or meta tags.
         * @type {Array}
         */
        this.defaults = [];
    }

    /**
     * Return the name of the controller.
     * @returns String
     */
    get name()
    {
        return this.constructor.name;
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
        if (! arguments.length || ! method) {
            return this;
        }

        if (arguments.length == 1)
        {
            if (Array.isArray(method)) {
                // We're passing an array of middleware.
                // Could be mix of strings and objects.
                _.each(method, middleware => { this.middleware(middleware) });

            } else if (typeof method == 'object') {
                // {methodName: [middleware]}
                _.each(method, (stack,route) => { this.middleware(route,stack) });

            } else {
                // Assign to all methods.
                // Could be string, fn or array.
                this.middleware("*", method);
            }

        } else if (typeof method == 'string') {
            // Assign middleware to a single method.
            // Or, use "*" to assign to all.
            this._middleware.push({method: method, middleware: stack})
        }

        return this;
    };

    /**
     * Dispatches the middleware and route stack.
     * Returns an array suitable for use with express.
     *
     * @param method {String}
     * @param extension {Extension}
     * @returns {Array}
     */
    dispatch(method,extension)
    {
        let controller = this;
        let routeName = `${this.name}.${method}`;

        if (typeof this[method] !== 'function') {
            throw new Error(`controller method does not exist: ${routeName}`);
        }

        let middleware = this._middleware.map(value =>
        {
            if (value.method == "*" || value.method == method)
                return this.app.dispatcher.resolve(value.middleware, extension);
        });

        /**
         * The requested route function.
         * @param request
         * @param response
         * @param next
         * @returns {*}
         */
        function route(request,response,next)
        {
            response.$route = routeName;

            if (response.headersSent) return null;

            // Allows the injection of services into a controller method.
            // The first 3 arguments are always the request/response/next params.
            let output = controller.app.call(controller, method, [request,response,next]);

            return response.smart(output);
        }

        route.$name = routeName;

        // Add the requested route to the end of the stack.
        middleware.push(route);

        return utils.compound(middleware);
    }
}

module.exports = Controller;