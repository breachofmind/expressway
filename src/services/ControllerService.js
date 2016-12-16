"use strict";

var Expressway  = require('expressway');
var Express     = require('express');
var _           = require('lodash');
var utils       = Expressway.utils;
var app         = Expressway.instance.app;
var debug       = app.get('debug');

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
        let dir = typeof Controller == "string" ? Controller : null;
        let type = null;

        try {
            if (dir) Controller = require(dir);
            var instance = app.call(Controller);
        } catch (err) {
            throw new Error(`Error loading Controller or Middleware: ${err.message} + ${dir}`);
        }

        if (instance instanceof Expressway.Controller) {
            type = "Controller";
        } else if (instance instanceof Expressway.Middleware) {
            type = "Middleware";
        } else {
            throw new Error("Unable to add controller, not a Controller or Middleware instance: "+dir);
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
        dir = dir.toString();
        if (! dir.endsWith("/")) dir+="/";
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
     * @param $module Module
     * @throws Error
     * @returns {Function|Array|null}
     */
    dispatchMiddleware(middlewareName,$module)
    {
        var middlewareInstance = this.getMiddleware(middlewareName);
        var middlewares = middlewareInstance.dispatch($module);

        if (! middlewares) return null;

        if (! Array.isArray(middlewares)) middlewares = [middlewares];

        return middlewares.map(middleware =>
        {
            // Just in case we're using a custom dispatch() method.
            // We want to be able to see the middleware name in the route listing.
            if (! middleware.$route) middleware.$route = middleware.name || middlewareInstance.name || "<anonymous>";

            return middleware;
        });
    }

    /**
     * Return all middleware and functions associated with the given controller and method.
     * @param controllerName string
     * @param method string
     * @param $module Module
     * @returns {Array}
     */
    dispatchController(controllerName,method,$module)
    {
        return this.get(controllerName).dispatch(method,$module);
    }

    /**
     * Given a string or functions, return an array of
     * functions for the express router.
     * @param values {Array|Function|String}
     * @param $module Module
     * @returns {Array}
     */
    getRouteFunctions(values,$module)
    {
        if (! Array.isArray(values)) values = [values];

        var out = values.map( value =>
        {
            switch(typeof value)
            {
                // Return a Router object to pass to express.
                // Objects look like: {"GET /": [Routes], ...}
                case "object" :

                    let router = Express.Router($module.options || {});

                    utils.toRouteMap(value).forEach((middleware,opts) =>
                    {
                        let stack = this.getRouteFunctions(middleware, $module);
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
                        let [controllerName,method] = value.split(".",2);
                        return this.dispatchController(controllerName,method,$module);
                    } else {
                        // Middleware
                        return this.dispatchMiddleware(value,$module);
                    }
                    break;

                // This is a regular express route function.
                // function(request,response,next) {...}
                case "function" :
                    return value;

                    break;
            }
        });

        var middlewares = _.compact( _.flattenDeep(out) );

        // Return the stack of functions to pass to express.route.
        // Remove any null or falsey values, express doesn't like it.
        // In the event nothing gets returned, send a default middleware.
        return middlewares.length ? middlewares : [utils.goToNext];
    }
}

module.exports = ControllerService;