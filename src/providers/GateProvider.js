"use strict";

var Expressway = require('expressway');

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

        this.contexts = [CXT_TEST, CXT_WEB];

        app.register('permissionBuilder', modelNames =>
        {
            return modelNames.map(model => {
                return ['create','read','update','delete'].map(action => {
                    return model+"."+action;
                })
            });

        }, "A helper function for building permissions")
    }

    /**
     * Register with the application.
     * @param app Application
     * @param modelService ModelService
     */
    register(app, modelService)
    {
        // Permission index.
        var permissions = buildPermissions();

        /**
         * Stores the permission index.
         * This comes from basic CRUD operations for each model.
         */
        function buildPermissions()
        {
            var items = ['superuser'];
            var crud = ['create','read','update','delete'];
            modelService.each(function(model) {
                crud.map(function(action){ items.push(`${model.name}.${action}`); });
                if (model.managed) {
                    items.push(`${model.name}.manage`);
                }
            });
            return items;
        }

        var Gate = require('../classes/Gate');

        app.register('gate', new Gate(permissions), "A service for checking user permissions via policies");
    }

}

module.exports = GateProvider;