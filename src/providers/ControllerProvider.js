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
        app.singleton('controllerService', require('../services/ControllerService'), 'Stores and fetches controller instances');

        // Expose the controller class for our wonderful developers.
        Expressway.Middleware = require('../classes/Middleware');
        Expressway.Controller = require('../classes/Controller');

        app.on('view.created', function(view,request){
            view.data.route = function(key,uri="") {
                return app.alias(key) + uri;
            }
        })
    }

    /**
     * Load all controllers defined in the ControllerService directories listing.
     * @param app Application
     * @param path PathService
     * @param controllerService ControllerService
     */
    boot(app,path,controllerService)
    {
        // System middleware
        controllerService.addDirectory(__dirname+"/../middlewares/");
    }
}

module.exports = ControllerProvider;