"use strict";

var expressway = require('expressway');
var utils = expressway.utils;

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.requires = [
            'LoggerProvider',
            'URLProvider',
            'ModelProvider'
        ];

        this.inject = ['events'];

        this.controllers = {};
    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        var Controller = app.call(this,'getControllerClass', [app,'events','Models']);

        app.register('Controller', Controller);
        app.register('ControllerProvider', this);

        // Expose the controller class.
        expressway.Controller = Controller;

        event.on('providers.registered', function(){
            app.call(this,'loadControllers', [app,'log','events']);
        }.bind(this));
    }

    /**
     * Load all controllers in the app directory.
     * @param app Application
     * @param log Winston
     * @param event EventEmitter
     */
    loadControllers(app,log,event)
    {
        var controllerPath = app.rootPath(app.conf('controllers_path', 'controllers') + "/");

        utils.getModules(controllerPath, function(path)
        {
            var Class = require(path);
            var instance = new Class(app);

            if (! (instance instanceof expressway.Controller)) {
                throw (path + " module does not return Controller instance");
            }
            instance.boot(app);

            log.debug('[Controller] Loaded: %s', instance.name);

        }.bind(this));

        event.emit('controllers.loaded',app);
    }

    /**
     * Check if the given controller is in the index.
     * @param name string
     * @returns {boolean}
     */
    hasController(name)
    {
        return this.controllers.hasOwnProperty(name);
    }

    /**
     * Dispatch a controller.
     * @param controllerName string
     * @param method
     * @returns {array|*}
     */
    dispatch(controllerName,method)
    {
        if (! this.hasController(controllerName)) {
            throw new Error(`"${controllerName}" controller does not exist`);
        }
        return this.controllers[controllerName].dispatch(method);
    }

    /**
     * return the base controller class.
     * @returns Controller
     */
    getControllerClass(app,event,Models)
    {
        var ControllerProvider = this;

        /**
         * Controller class.
         * @constructor
         */
        return class Controller
        {
            constructor()
            {
                this.name = this.constructor.name;
                this.Models = Models;
                this.inject = [];

                this._methods = {};
                this._middleware = [];

                if (ControllerProvider.hasController(this.name)) {
                    throw new Error(`"${this.name}" controller exists already`);
                }

                ControllerProvider.controllers[this.name] = this;
            }

            /**
             * Boot the controller into the application.
             * @param app Application
             */
            boot(app)
            {
                return this._methods = app.call(this,'methods',[app].concat(this.inject));
            }

            /**
             * Stub for controller methods.
             * @param app Application
             */
            methods(app)
            {
                throw new Error(`"${this.name}" Controller does not return any methods`);
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
                var controller = this;

                event.once('controllers.loaded', function(app) {

                    if (typeof stack == 'undefined') {
                        if (typeof method == 'object') {
                            // Object has route: middlewares.
                            Object.keys(method).forEach(function(route){
                                let stack = method[route];
                                controller._middleware.push({method: route, middleware: utils.getRouteFunctions(stack, ControllerProvider)})
                            })

                        } else if (typeof method == 'function') {
                            // Assign middleware to all methods.
                            controller._middleware = controller._middleware.concat(utils.getRouteFunctions(method, ControllerProvider));
                        }

                        // Assign middleware to a single method.
                    } else if (typeof method == 'string') {
                        controller._middleware.push({method: method, middleware: utils.getRouteFunctions(stack, ControllerProvider)})
                    }

                });

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
            query(parameter,handler)
            {
                return this.middleware(function queryMiddleware(request,response,next) {
                    if (request.query.hasOwnProperty(parameter)) {
                        handler(request.query[parameter], request,response,next);
                    }
                    return next();
                });
            };


            /**
             * Check if this controller has a method.
             * @param method string
             * @returns {*|boolean}
             */
            has(method)
            {
                return this._methods.hasOwnProperty(method);
            };

            /**
             * Use a particular method on this controller.
             * @param method string
             * @returns {*}
             */
            use(method)
            {
                if (this.has(method)) {
                    return this._methods[method];
                }
                throw(`Controller "${this.name}" does not contain method "${method}"`);
            };

            /**
             * Finds middleware required for the given route.
             * @param method string
             * @param action function
             * @returns {array}
             * @private
             */
            getMiddleware(method, action)
            {
                var out = this._middleware.reduce(function(memo,value)
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
             * Dispatches the middleware and route stack.
             * Returns an array suitable for use with express.
             * ie, router.get(urlpattern, array)
             * @param method string
             * @returns {array}
             */
            dispatch(method)
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
                return this.getMiddleware(method, routeRequest);
            }
        }
    }
}

module.exports = new ControllerProvider();