"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var ControllerProvider = app.get('ControllerProvider');
var utils = Expressway.utils;

/**
 * Controller class.
 * Handles organization of Model/Data logic and routing.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Controller
{
    constructor(app)
    {
        this.name = this.constructor.name;
        this.app  = app;

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
        var controller = this;

        this.app.event.once('controllers.loaded', function(app) {

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
                return handler(request.params[parameter], request,response,next);
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
                return handler(request.query[parameter], request,response,next);
            }
            return next();
        });
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
        var controller = this;

        if (! typeof this[method] === 'function') {
            throw new Error(`"${this.name}" missing method "${method}"`);
        }

        function routeRequest(request,response,next)
        {
            request.setController(controller.name, method);

            if (response.headersSent) {
                return null;
            }
            // ALlows the injection of services into a controller method.
            // The first 3 arguments are always the request/response/next params.
            var output = app.call(controller, method, [request,response,next]);

            return response.smart( output );
        }
        return this.getMiddleware(method, routeRequest);
    }
}

module.exports = Controller;