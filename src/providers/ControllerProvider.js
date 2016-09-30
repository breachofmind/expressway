"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'URLProvider',
            'ModelProvider'
        ];

        this.inject = ['event'];

        this.controllers = {};
    }

    /**
     * Register the controller factory class with the app.
     * @param event EventEmitter
     */
    register(event)
    {
        var Controller = require('./classes/Controller');

        this.app.register('Controller', Controller);
        this.app.register('ControllerProvider', this);

        // Expose the controller class.
        Expressway.Controller = Controller;

        // All providers should be registered first,
        // In case we're using a provider that adds a controller.
        event.on('providers.registered', function()
        {
            this.app.call(this,'loadControllers', ['log','event']);

        }.bind(this));
    }

    /**
     * Load all controllers in the app directory.
     * @param log Winston
     * @param event EventEmitter
     */
    loadControllers(log,event)
    {
        var controllerPath = this.app.path('controllers_path', 'controllers') + "/";

        utils.getModules(controllerPath, function(path)
        {
            var Class = require(path);
            var instance = new Class(this.app);

            if (! (instance instanceof Expressway.Controller)) {
                throw (path + " module does not return Controller instance");
            }

            this.controllers[instance.name] = instance;

            log.debug('[Controller] Loaded: %s', instance.name);

        }.bind(this));

        event.emit('controllers.loaded',this.app);
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