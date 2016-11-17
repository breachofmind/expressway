"use strict";

var Expressway = require('expressway');
var utils      = require('../support/utils');

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'CoreProvider',
            'DriverProvider'
        ];

        this.order = 1;
    }


    /**
     * Register the provider with the application.
     * @param app Application
     * @param debug function
     * @param driverProvider DriverProvider
     */
    register(app,debug,driverProvider)
    {
        app.singleton('modelService', require('../services/ModelService'), "Service for storing and retrieving models");

        debug(this,'Using driver: %s', driverProvider.alias);

        // Expose the Driver model class.
        Expressway.Model = driverProvider.Model;
    }

    /**
     * Load all models.
     * @param app Application
     * @param path PathService
     * @param modelService ModelService
     * @returns {object}
     */
    boot(app,path,modelService)
    {
        utils.getModules(path.models("/"), modulePath =>
        {
            modelService.add(modulePath);
        });

        modelService.boot();

        app.emit('models.loaded', app);
    }
}

module.exports = ModelProvider;