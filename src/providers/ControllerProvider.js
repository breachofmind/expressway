"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends Expressway.Provider
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'CoreProvider',
            'ModelProvider'
        ];

        this.controllers = {};

    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        var Controller = require('./classes/Controller');

        app.register('Controller', Controller, 'The base Controller class');
        app.register('ControllerProvider', this, 'The Controller Provider, for getting/setting controller instances');

        // Expose the controller class.
        Expressway.Controller = Controller;

        // All providers should be registered first,
        // In case we're using a provider that adds a controller.
        event.on('providers.registered', app => {
            app.register('controllers', app.call(this,'loadControllers'), "An object containing all loaded Controller instances");
        });
    }

    /**
     * Load all controllers in the app directory.
     * @param app Application
     * @param debug function
     * @param event EventEmitter
     * @returns object
     */
    loadControllers(app,debug,event)
    {
        var controllerPath = app.path('controllers_path', 'controllers') + "/";

        utils.getModules(controllerPath, function(path)
        {
            var Class = require(path);
            var instance = app.call(Class);

            if (! (instance instanceof Expressway.Controller)) {
                throw (path + " module does not return Controller instance");
            }

            this.controllers[instance.name] = instance;

            debug(this,'Loaded: %s', instance.name);

        }.bind(this));

        event.emit('controllers.loaded',app);

        return this.controllers;
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
}

module.exports = ControllerProvider;