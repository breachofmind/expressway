"use strict";

var Expressway = require('expressway');

const CRUD = ['create','read','update','delete'];

/**
 * Provides a gate that checks user permissions.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GateProvider extends Expressway.Provider
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
            'ModelProvider'
        ];

        app.register('permissionBuilder', this.permissionBuilder, "A helper function for building permissions");
    }

    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        var Gate = require('../classes/Gate');

        Expressway.Policy = require('../classes/Policy');

        app.register('gate', new Gate, "A service for checking user permissions via policies");
    }

    /**
     * Load default permissions.
     * @param gate Gate
     * @param modelService ModelService
     */
    boot(gate,modelService)
    {

    }

    /**
     * A helper function for building permissions.
     * @param modelNames {Array}
     * @returns {Array}
     */
    permissionBuilder(modelNames = [])
    {
        return modelNames.map(model => {
            return CRUD.map(action => { return model+"."+action })
        });
    }
}

module.exports = GateProvider;