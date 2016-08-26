"use strict";
var Provider = require('../provider');

/**
 * The gate class.
 * @constructor
 */
class Gate
{
    /**
     * Constructor.
     * @param app Application
     * @param permissions array
     */
    constructor(app,permissions)
    {
        this.app = app;
        this.permissions = permissions;
    }

    /**
     * Check if the gate has the permission stored.
     * @param key
     * @returns {*|boolean}
     */
    hasPermission(key)
    {
        return this.permissions.hasOwnProperty(key);
    }

    /**
     * Check if a user has this permission.
     * @param user User model
     * @param object string
     * @param method string
     * @returns {boolean}
     */
    check(user,object,method)
    {
        var key = `${object}.${method}`;
        // If the permission doesn't exist, then default is true.
        if (! this.hasPermission(key)) return true;

        // TODO
        // return user.permissions.indexOf(key) > -1;
        return true;
    }
}

/**
 * Provides a gate that checks user permissions.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GateProvider extends Provider
{
    constructor()
    {
        super('gate');

        this.requires([
            'logger',
            'database',
            'auth',
            'model'
        ]);

        // CLI doesn't need permissions.
        this.inside([ENV_LOCAL,ENV_DEV,ENV_PROD,ENV_TEST]);
    }

    register(app)
    {
        var permissions = {};

        if (! app.ModelFactory.has('Permission')) {
            throw ("Gate provider requires the Permission model");
        }

        /**
         * Stores the permission index.
         */
        function getPermissions(app,Factory)
        {
            var Permission = Factory.object('Permission');

            // Load permissions into memory.
            Permission.find().exec().then(function(models) {
                models.forEach(function(model){
                    // Stored in dot syntax. ie, user.edit, user.create
                    permissions[model.object+"."+model.method] = model.id;
                });
                // Attach the gate object to the application.
                app.gate = new Gate(permissions);

                app.event.emit('gate.loaded', app.gate);

                app.logger.debug('[Gate] Loaded permissions: %d', models.length);
            });
        }

        // When the models are created, get the permissions.
        app.event.on('models.loaded', getPermissions)
    }
}

module.exports = new GateProvider();