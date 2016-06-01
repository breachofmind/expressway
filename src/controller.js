"use strict";

var Application = require('./application');

var app;
var controllers = {};

class ControllerFactory
{
    /**
     * Boot method.
     * @param factory ModelFactory
     */
    static boot(factory)
    {
        if (!app) {
            app = Application.instance;
        }
    }
    /**
     * Constructor
     * @param setup function
     */
    constructor(setup)
    {
        ControllerFactory.boot(this);

        this._bindings = {};

        this.methods = setup(this);
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
            : function errorMethod(request,params,response) { return false; }
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
     * Replace a parameter with a new value.
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
     * Apply the bindings to parameters to the request.
     * @param request
     * @param response
     */
    applyBindings(request,response)
    {
        for(var param in request.params)
        {
            var callback = this._bindings[param];
            if (callback) {
                callback(request.params[param],request,response);
            }
        }
    }

    /**
     * Load the given files.
     * @param items array
     * @returns {*}
     */
    static load(items)
    {
        items.forEach(function(file) {
            require('../app/controllers/'+file);
        });

        return controllers;
    }

    /**
     * Create a new controller instance.
     * @param name string
     * @param setup function
     * @returns {ControllerFactory}
     */
    static create(name, setup)
    {
        return controllers[name] = new ControllerFactory(setup);
    }

    /**
     * Return a controller by name.
     * @param name string
     * @returns {*}
     */
    static find(name)
    {
        return controllers[name] || null;
    }

    /**
     * Return all set controllers.
     * @returns {{}}
     */
    static all()
    {
        return controllers;
    }

    /**
     * Dispatch a controller.
     * @param name string
     * @param method string
     * @returns {Function}
     */
    static dispatch(name, method)
    {
        var controller = ControllerFactory.find(name);
        var action = controller.use(method);

        /**
         * Callback served to router.
         */
        return function(request,response,next)
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
    }
}

module.exports = ControllerFactory;