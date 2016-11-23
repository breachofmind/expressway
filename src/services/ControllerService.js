"use strict";

var Expressway = require('expressway');
var Express = require('express');
var utils = Expressway.utils;
var Path = require('path');
var app = Expressway.instance.app;
var _ = require('lodash');
var [debug,path] = app.get('debug','path');

/**
 * Handles the storage and retrieval of controller classes.
 * @author Mike Adamczyk <mike@bom.us>
 * @since 0.6.0
 */
class ControllerService
{
    constructor()
    {
        /**
         * Controller instances.
         * @type {{}}
         */
        this.controllers = {};

        /**
         * Middleware instances.
         * @type {{}}
         */
        this.middlewares = {};

        /**
         * Directories to look for Controller or Middleware classes.
         * @type {Array<String>}
         */
        this.directories = [];
    }

    /**
     * Check if the given controller is in the index.
     * @param controllerName string
     * @returns {boolean}
     */
    hasController(controllerName)
    {
        return this.controllers.hasOwnProperty(controllerName);
    }

    /**
     * Check if the given middleware is in the index.
     * @param middlewareName string
     * @returns {boolean}
     */
    hasMiddleware(middlewareName)
    {
        return this.middlewares.hasOwnProperty(middlewareName);
    }

    /**
     * Add a new controller or middleware class.
     * @param Controller string|Controller|Middleware
     * @throws Error
     * @returns {Controller|Middleware}
     */
    add(Controller)
    {
        var path = typeof Controller == "string" ? Controller : null,
            type;

        try {
            if (path) Controller = require(path);
            var instance = app.call(Controller);
        } catch (err) {
            throw new Error(`Error loading Controller or Middleware: ${err.message} + ${path}`);
        }

        if (instance instanceof Expressway.Controller) {
            type = "Controller";
        } else if (instance instanceof Expressway.Middleware) {
            type = "Middleware";
        } else {
            throw new Error("Unable to add controller, not a Controller or Middleware instance: "+path);
        }

        this[type.toLowerCase()+"s"][instance.name] = instance;

        debug(this,`Added ${type}: %s`, instance.name);

        return instance;
    }

    /**
     * Add all files in a directory.
     * @param dir string|PathObject
     */
    addDirectory(dir)
    {
        utils.getModules(dir.toString(), moduleName => {
            this.add(moduleName);
        });
    }

    /**
     * Get a controller by name.
     * @param controllerName string
     * @throws Error
     * @returns {Controller}
     */
    get(controllerName)
    {
        if (! this.hasController(controllerName)) {
            throw new Error(`"${controllerName}" controller does not exist`);
        }
        return this.controllers[controllerName];
    }

    /**
     * Get a middleware by name.
     * @param middlewareName string
     * @returns {null|Middleware}
     */
    getMiddleware(middlewareName)
    {
        if (! this.hasMiddleware(middlewareName)) {
            throw new Error(`"${middlewareName}" middleware does not exist`);
        }
        return this.middlewares[middlewareName];
    }

    /**
     * Return the function associated with the given middleware.
     * @param middlewareName string
     * @throws Error
     * @returns {Function}
     */
    dispatchMiddleware(middlewareName)
    {
        var middleware = this.getMiddleware(middlewareName);
        var func = middleware.dispatch();

        // Just in case we're using a custom dispatch() method.
        // We want to be able to see the middleware name in the route listing.
        if (! func.$route) func.$route = middleware.name;
        return func;
    }

    /**
     * Return all middleware and functions associated with the given controller and method.
     * @param controllerName string
     * @param method string
     * @returns {Array}
     */
    dispatchController(controllerName,method)
    {
        return this.get(controllerName).dispatch(method);
    }

    /**
     * Given a string or functions, return an array of
     * functions for the express router.
     * @param values {Array|Function|String}
     * @param args mixed
     * @returns {Array}
     */
    getRouteFunctions(values,args)
    {
        if (! Array.isArray(values)) values = [values];

        var out = values.map( value =>
        {
            switch(typeof value)
            {
                // Return a Router object to pass to express.
                // Objects look like: {"GET /": [Routes], ...}
                case "object" :

                    let router = Express.Router(args);

                    utils.toRouteMap(value).forEach((middleware,opts) =>
                    {
                        var stack = this.getRouteFunctions(middleware);
                        if (! stack.length) throw new Error("Route declaration missing routes: "+opts.url);

                        // Add the routes to the express router.
                        router[opts.verb].apply(router, [opts.url].concat(stack) );
                    });
                    return router;

                    break;

                // Can be Middleware name or Controller.route name.
                case "string" :
                    if (value.indexOf(".") > -1) {
                        // Controller
                        var [controllerName,method] = value.split(".",2);
                        return this.dispatchController(controllerName,method);
                    } else {
                        // Middleware
                        return this.dispatchMiddleware(value);
                    }
                    break;

                // This is a regular express route function.
                // function(request,response,next) {...}
                case "function" :
                    if (!value.$route) value.$route = value.name || "anonymous";
                    return value;

                    break;
            }
        });

        // Return the stack of functions to pass to express.route.
        return _.flattenDeep(out);
    }
}

module.exports = ControllerService;