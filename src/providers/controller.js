"use strict";
var Provider = require('../provider');

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends Provider
{
    constructor()
    {
        super('controller');
    }

    register(app)
    {
        var utils = app.utils;
        /**
         * Path relative to your application that contains the controller declarations.
         * @type {string}
         */
        var controllerPath = app.rootPath(app.conf('controllers_path', 'controllers') + "/");

        /**
         * Controller factory class, for creating new controllers.
         * @usage ControllerFactory.create('controllerName', function(app){...})
         * @constructor
         */
        class ControllerFactory
        {
            /**
             * Constructor
             * @param setup function
             */
            constructor(setup)
            {
                this._bindings = {};
                this._queryBindings = {};
                this._middleware = [];

                this.methods = setup.call(this,app);
            }

            /**
             * Return an action. If doesn't exist, empty method.
             * @param name string
             * @returns {*|Function}
             */
            use(name)
            {
                return this.has(name)
                    ? this.methods[name]
                    : function errorMethod(request,response) { return false; }
            }

            /**
             * Check if controller has the given method.
             * @param name string
             * @returns {boolean}
             */
            has(name)
            {
                return this.methods[name] ? true:false;
            }

            /**
             * Associate certain methods on this controller with middleware.
             * @param methods object {route: [middlewareFunction, ...]}
             * @return ControllerFactory
             */
            middleware(methods)
            {
                // This middleware is assigned to all methods.
                if (typeof methods == 'function') {
                    this._middleware.push(methods);
                    return this;
                }
                for (let methodName in methods)
                {
                    var middlewares = methods[methodName];
                    if (! Array.isArray(middlewares)) {
                        middlewares = [middlewares];
                    }
                    middlewares.forEach(function(middleware) {
                        this._middleware.push({
                            method: methodName,
                            middleware: middleware
                        });
                    }.bind(this));
                }
                return this;
            }

            /**
             * When a url parameter matches the given key, run a callback against it.
             * @param parameter string
             * @param callback function
             * @returns {ControllerFactory}
             */
            bind(parameter, callback)
            {
                this._bindings[parameter] = callback;
                return this;
            }

            /**
             * When a url query parameter matches a given key, run a callback against it.
             * @param key string
             * @param callback
             * @returns {ControllerFactory}
             */
            query(key, callback)
            {
                this._queryBindings[key] = callback;
                return this;
            }

            /**
             * Apply the bindings to parameters to the request.
             * @param request
             * @param response
             */
            applyBindings(request,response)
            {
                var objects = {
                    params: this._bindings,
                    query: this._queryBindings
                };
                for (var prop in objects) {
                    if (! objects.hasOwnProperty(prop)) {
                        continue;
                    }
                    var index = objects[prop];
                    for (var key in request[prop])
                    {
                        if (! index.hasOwnProperty(key)) {
                            continue;
                        }
                        index[key] (request[prop][key], request,response);
                    }
                }
            }

            /**
             * Combine the route request with the middleware for Controller.dispatch.
             * @param method string method requested
             * @param routeRequest function
             * @returns {*}
             */
            getMiddleware(method, routeRequest)
            {
                var out = this._middleware.reduce(function(memo,value)
                {
                    if (typeof value == 'function') {
                        memo.push(value);
                    } else if (typeof value == 'object' && value.method == method) {
                        memo.push(value.middleware);
                    }
                    return memo;
                },[]);

                out.push(routeRequest);
                return out;
            }

            /**
             * Load the given files.
             * @param items array
             * @returns {*}
             */
            static load(items)
            {
                items.forEach(function(file) {

                    var controller = require(controllerPath+"/"+file) (ControllerFactory, app);
                    app.event.emit('load_controller', controller);
                });

                return ControllerFactory.controllers;
            }

            /**
             * Create a new controller instance.
             * @param name string
             * @param setup function
             * @returns {ControllerFactory}
             */
            static create(name, setup)
            {
                return ControllerFactory.controllers[name] = new ControllerFactory(setup);
            }

            /**
             * Return a controller by name.
             * @param name string
             * @returns {*}
             */
            static get(name)
            {
                return ControllerFactory.controllers[name] || null;
            }

            /**
             * Return all set controllers.
             * @returns {{}}
             */
            static all()
            {
                return ControllerFactory.controllers;
            }

            /**
             * Dispatch a controller.
             * @param name string
             * @param method string
             * @returns {Function|Array}
             */
            static dispatch(name, method)
            {
                var controller = ControllerFactory.get(name);
                var action = controller.use(method);

                /**
                 * Callback served to router.
                 */
                function routeRequest(request,response,next)
                {
                    request.controller.name = name;
                    request.controller.method = method;

                    // Do the deed.
                    controller.applyBindings(request,response);

                    if (response.headersSent) {
                        return null;
                    }
                    return response.smart( action(request,response,next) );
                }
                return controller.getMiddleware(method, routeRequest)
            }

            /**
             * Boot all created controllers.
             * @returns void
             */
            static boot()
            {
                var files = utils.getFileBaseNames(controllerPath);

                ControllerFactory.load(files);
            }
        }

        /**
         * Repository of controller objects.
         * @type {{}}
         */
        ControllerFactory.controllers = {};

        // Attach the factory to the application for use by other modules.
        app.ControllerFactory = ControllerFactory;

        app.event.on('provider.registered', function(app) {
            ControllerFactory.boot();
        });

    }
}

module.exports = new ControllerProvider();