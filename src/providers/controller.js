"use strict";
var expressway = require('expressway');
var utils = expressway.utils;


/**
 * The controller factory class.
 * Assists with storing and building controllers.
 *
 * @author Mike Adamczyk <mike@bom.us>
 */
function ControllerFactory(app)
{
    var factory = this;
    var controllers = {};

    /**
     * Load a file or file array.
     * @param files string|array
     * @returns object
     */
    this.load = function(files)
    {
        if (! Array.isArray(files)) files = [files];

        files.forEach(function(file)
        {
            var controller = require(file);
            if (controller instanceof Controller) {
                controllers[controller.name] = controller;
                app.logger.debug('[Controller] Loaded: %s', controller.name);
                return true;
            }
            throw (file+" does not return a controller instance");
        });

        return controllers;
    };

    /**
     * Create a new controller instance.
     * @param name string
     * @param boot function
     * @returns {Controller}
     */
    this.create = function(name, boot)
    {
        return new Controller(name, boot);
    };

    /**
     * Check if a controller has been registered in the index.
     * @param name string
     * @returns {boolean}
     */
    this.has = function(name)
    {
        return controllers.hasOwnProperty(name);
    };

    /**
     * Get a controller from the index.
     * @param name string
     * @returns {Controller}
     */
    this.get = function(name)
    {
        if (this.has(name)) {
            return controllers[name];
        }
        throw(`Controller ${name} does not exist`);
    };

    /**
     * Dispatch a controller and method.
     * @param name string controller name
     * @param method string method name
     * @returns {array}
     */
    this.dispatch = function(name,method)
    {
        return this.get(name).dispatch(method);
    };



    /**
     * Controller class.
     *
     * @param name string
     * @param boot function
     * @constructor
     */
    function Controller(name,boot)
    {
        var middleware = [];

        this.name = name;

        /**
         * Bind a parameter to a middleware.
         * @param parameter string
         * @param handler function
         * @returns Controller
         */
        this.bind = function(parameter,handler)
        {
            return this.middleware(function parameterMiddleware(request,response,next) {
                if (request.params.hasOwnProperty(parameter)) {
                    handler(request.params[parameter], request,response,next);
                }
                return next();
            });
        };

        /**
         * Bind a GET query to a middleware.
         * @param parameter string
         * @param handler function
         * @returns Controller
         */
        this.query = function(parameter,handler)
        {
            return this.middleware(function queryMiddleware(request,response,next) {
                if (request.query.hasOwnProperty(parameter)) {
                    handler(request.query[parameter], request,response,next);
                }
                return next();
            });
        };


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
        this.middleware = function(method, stack)
        {
            if (! method || !arguments.length) {
                return this;
            }
            app.event.once('controllers.loaded', function(app) {

                if (typeof stack == 'undefined') {
                    if (typeof method == 'object') {
                        // Object has route: middlewares.
                        Object.keys(method).forEach(function(route){
                            let stack = method[route];
                            middleware.push({method: route, middleware: utils.getRouteFunctions(stack, factory)})
                        })

                    } else if (typeof method == 'function') {
                        // Assign middleware to all methods.
                        middleware = middleware.concat(utils.getRouteFunctions(method, factory));
                    }



                    // Assign middleware to a single method.
                } else if (typeof method == 'string') {
                    middleware.push({method: method, middleware: utils.getRouteFunctions(stack, factory)})
                }
            });

            return this;
        };

        /**
         * Finds middleware required for this route.
         * @param method string
         * @param action function
         * @returns {array}
         * @private
         */
        this._getMiddleware = function(method, action)
        {
            var out = middleware.reduce(function(memo,value)
            {
                // A single function applies to all methods.
                if (typeof value == 'function') {
                    memo.push(value);

                    // Controller method middleware, which could be an array.
                } else if (typeof value == 'object' && value.method == method) {
                    memo = memo.concat(value.middleware);
                }
                return memo;
            },[]);

            // The last middleware in the stack is the actual request.
            out.push(action);

            return out;
        };

        /**
         * Check if this controller has a method.
         * @param method string
         * @returns {*|boolean}
         */
        this.has = function(method)
        {
            return this.methods.hasOwnProperty(method);
        };

        /**
         * Use a particular method on this controller.
         * @param method string
         * @returns {*}
         */
        this.use = function(method)
        {
            if (this.has(method)) {
                return this.methods[method];
            }
            throw(`Controller "${this.name}" does not contain method "${method}"`);
        };

        /**
         * Dispatches the middleware and route stack.
         * Returns an array suitable for use with express. ie, router.get(urlpattern, array)
         * @param method string
         * @returns {array}
         */
        this.dispatch = function(method)
        {
            var action = this.use(method);
            var name = this.name;

            function routeRequest(request,response,next)
            {
                request.setController(name,method);

                if (response.headersSent) {
                    return null;
                }
                return response.smart( action(request,response,next) );
            }
            return this._getMiddleware(method, routeRequest);
        };

        // Constructor
        this.methods = boot.call(this,app);
    }
}


/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends expressway.Provider
{
    constructor()
    {
        super('controller');

        this.requires([
            'url',
            'orm'
        ]);
    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     */
    register(app)
    {
        // Where are the controller modules located?
        var controllerPath = app.rootPath(app.conf('controllers_path', 'controllers') + "/");

        var factory = new ControllerFactory(app);

        // Expose the factory class.
        expressway.Controller = factory;
        app.ControllerFactory = factory;

        factory.load(utils.getModules(controllerPath));

        app.event.emit('controllers.loaded',app);
    }
}

module.exports = new ControllerProvider();