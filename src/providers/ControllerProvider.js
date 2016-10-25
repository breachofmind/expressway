"use strict";

var Expressway = require('expressway');

require('../support/prototypes');

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
            'ModelProvider',
            'ViewProvider'
        ];
    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     */
    register(app)
    {
        app.singleton('controllerService', __dirname+'/../services/ControllerService',
            'Stores and fetches controller instances');

        // Expose the controller class for our wonderful developers.
        Expressway.Middleware = require('../classes/Middleware');
        Expressway.Controller = require('../classes/Controller');
    }

    /**
     * Load all controllers defined in the ControllerService directories listing.
     * @param app Application
     * @param event EventEmitter
     * @param path PathService
     * @param controllerService ControllerService
     */
    boot(app,event,path,controllerService)
    {
        // System middleware
        controllerService.addDirectory(__dirname+"/../middlewares/");
        // User defined middleware
        controllerService.addDirectory(path.middlewares());
        // User defined controllers
        controllerService.addDirectory(path.controllers());

        // Any other directories to look in
        controllerService.directories.forEach(dir => {
            controllerService.addDirectory(dir);
        });

        event.emit('controllers.loaded',app);
    }
}

module.exports = ControllerProvider;