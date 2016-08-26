"use strict";
var mvc = require('../../index');
var utils = mvc.utils;

/**
 * The controller factory class.
 * Assists with storing and building controllers.
 *
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerFactory
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        this.app = app;
        this.controllers = {};
    }

    /**
     * Load a file or file array.
     * @param files string|array
     * @returns object
     */
    load(files)
    {
        if (! Array.isArray(files)) files = [files];

        files.forEach(function(file)
        {
            var controller = require(file);
            if (controller instanceof Controller) {
                this.controllers[controller.name] = controller;
                this.app.logger.debug('[Controller] Loaded: %s', controller.name);
            }

        }.bind(this));

        return this.controllers;
    }

    /**
     * Create a new controller instance.
     * @param name string
     * @param boot function
     * @returns {Controller}
     */
    create(name, boot)
    {
        return new Controller(name, boot, this);
    }

    /**
     * Check if a controller has been registered in the index.
     * @param name string
     * @returns {boolean}
     */
    has(name)
    {
        return this.controllers.hasOwnProperty(name);
    }

    /**
     * Get a controller from the index.
     * @param name string
     * @returns {Controller}
     */
    get(name)
    {
        if (this.has(name)) {
            return this.controllers[name];
        }
        throw(`Controller ${name} does not exist`);
    }

    /**
     * Dispatch a controller and method.
     * @param name string controller name
     * @param method string method name
     * @returns {array}
     */
    dispatch(name,method)
    {
        return this.get(name).dispatch(method);
    }
}

/**
 * Controller class.
 * Binds data with the view in an organized way.
 *
 * @author Mike Adamczyk <mike@bom.us>
 */
class Controller
{
    /**
     * Constructor.
     * @param name string - unique controller name
     * @param boot function
     * @param factory ControllerFactory
     */
    constructor(name, boot, factory)
    {
        this._middleware = [];
        this._factory = factory;
        this._app = factory.app;

        this.name = name;
        this.methods = boot.call(this, this._app);
    }

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
    }

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
        this._app.event.once('controllers.loaded', function(app) {
            // Assign middleware to all methods.
            if (stack == undefined) {
                this._middleware = this._middleware.concat(utils.getRouteFunctions(method, this._factory));

                // Assign middleware to a single method.
            } else if (typeof method == 'string') {
                this._middleware.push({method: method, middleware: utils.getRouteFunctions(stack, this._factory)})
            }
        }.bind(this));

        return this;
    }

    /**
     * Finds middleware required for this route.
     * @param method string
     * @param action function
     * @returns {array}
     * @private
     */
    _getMiddleware(method, action)
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
    }

    /**
     * Check if this controller has a method.
     * @param method string
     * @returns {*|boolean}
     */
    has(method)
    {
        return this.methods.hasOwnProperty(method);
    }

    /**
     * Use a particular method on this controller.
     * @param method string
     * @returns {*}
     */
    use(method)
    {
        if (this.has(method)) {
            return this.methods[method];
        }
        throw(`Controller "${this.name}" does not contain method "${method}"`);
    }

    /**
     * Dispatches the middleware and route stack.
     * Returns an array suitable for use with express. ie, router.get(urlpattern, array)
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
        return this._getMiddleware(method, routeRequest);
    }

}

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends mvc.Provider
{
    constructor()
    {
        super('controller');

        this.requires('url');
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
        mvc.Controller = factory;
        app.ControllerFactory = factory;

        factory.load(utils.getFileBaseNames(controllerPath).map(function(name) {
            return controllerPath + name;
        }));

        app.event.emit('controllers.loaded',app);
    }
}

module.exports = new ControllerProvider();