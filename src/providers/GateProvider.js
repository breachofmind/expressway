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
            'AuthProvider',
            'ModelProvider'
        ];

        this.contexts = [CXT_TEST, CXT_WEB];

        app.register('permissionBuilder', function(modelNames) {
            var out = [];
            modelNames.forEach(function(model) {
                ['create','read','update','delete'].forEach(function(action) {
                    out.push(model+"."+action);
                })
            });
            return out;
        }, "A helper function for building permissions")
    }

    /**
     * Register with the application.
     * @param app Application
     * @param ModelProvider ModelProvider
     */
    register(app, ModelProvider)
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
            ModelProvider.each(function(model) {
                crud.map(function(action){ items.push(`${model.name}.${action}`); });
                if (model.managed) {
                    items.push(`${model.name}.manage`);
                }
            });
            return items;
        }

        var Gate = require('./classes/Gate');
        var gate = new Gate(permissions);

        app.register('gate', gate);
    }

}

module.exports = GateProvider;