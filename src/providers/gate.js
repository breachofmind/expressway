"use strict";
var Provider = require('../provider');

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

        if (! app.ModelFactory.has('permission')) {
            throw ("Gate provider requires the Permission model");
        }

        /**
         * Stores the permission index.
         */
        function getPermissions(Factory)
        {
            var Permission = Factory.Permission;

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

        /**
         * The gate class.
         * @constructor
         */
        class Gate
        {
            /**
             * Constructor.
             * @param permissions array
             */
            constructor(permissions)
            {
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

        // When the models are created, get the permissions.
        app.event.on('models.built', getPermissions)
    }
}

module.exports = new GateProvider();