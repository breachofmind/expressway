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
    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        var ControllerService = require('../services/ControllerService');

        app.register('controllerService', new ControllerService, 'Stores and fetches controller instances');

        // Expose the controller class for our wonderful developers.
        Expressway.Controller = require('../classes/Controller');

        // All providers should be registered first,
        // In case we're using a provider that adds a controller.
        event.on('providers.registered', app => { app.call(this,'load') });
    }

    /**
     * Load all controllers defined in the ControllerService directories listing.
     * @param app Application
     * @param event EventEmitter
     * @param controllerService ControllerService
     * @returns object
     */
    load(app,event,controllerService)
    {
        controllerService.directories.forEach(dir =>
        {
            utils.getModules(dir, modulePath =>
            {
                controllerService.add(modulePath);
            });
        });

        event.emit('controllers.loaded',app);
    }


}

module.exports = ControllerProvider;