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
     * @param modelService ModelService
     */
    register(app, modelService)
    {
        /**
         * Stores the permission index.
         * This comes from basic CRUD operations for each model.
         */
        function buildPermissions()
        {
            var items = ['superuser'];

            modelService.each(function(model) {
                CRUD.map(function(action){ items.push(`${model.name}.${action}`); });
                if (model.managed) {
                    items.push(`${model.name}.manage`);
                }
            });
            return items;
        }

        var Gate = require('../classes/Gate');

        app.register('gate', new Gate( buildPermissions() ), "A service for checking user permissions via policies");
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