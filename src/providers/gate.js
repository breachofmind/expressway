"use strict";
var Provider = require('../provider');

/**
 * The gate class.
 * Checks user permissions via policies.
 * @constructor
 */
function Gate(app, permissions)
{
    Object.defineProperty(this, 'permissions', {
        get: function() {
            return permissions;
        }
    });

    var policies = [];

    /**
     * Add a gate to the queue.
     * @param policy function
     * @returns Gate
     */
    this.policy = function(policy)
    {
        if (typeof policy == 'function') {
            app.logger.debug("[Gate] Adding Policy: %s", policy.name);
            policies.push(policy);
        }
        return this;
    };

    /**
     * Check if the gate has the permission stored.
     * @param key
     * @returns {*|boolean}
     */
    this.contains = function(key)
    {
        return permissions.indexOf(key) > -1;
    };

    /**
     * Check if a user has permission.
     * @param user User model
     * @param object string
     * @param action string
     * @param args mixed - optional
     * @returns {boolean}
     */
    this.check = function(user,object,action,args)
    {
        for (let i=0; i<policies.length; i++)
        {
            var passed = policies[i].call(this,user,object,action,args);
            if (typeof passed === 'boolean') {
                return passed;
            }
        }
        return true;
    };
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
            app.ModelFactory.each(function(model) {
                crud.map(function(action){ items.push(`${model.name}.${action}`); });
                if (model.managed) {
                    items.push(`${model.name}.manage`);
                }
            });
            return items;
        }

        app.gate = new Gate(app, permissions);
    }
}

module.exports = new GateProvider();