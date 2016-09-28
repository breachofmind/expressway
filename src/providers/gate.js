"use strict";

var expressway = require('expressway');

/**
 * Provides a gate that checks user permissions.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GateProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.requires = [
            'LoggerProvider',
            'AuthProvider',
            'ModelProvider'
        ];

        this.environments = ENV_WEB;

        this.inject = ['ModelProvider'];
    }

    register(app,ModelProvider)
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

        var Gate = app.call(this,'getGateClass',[app,'log']);

        app.register('gate', new Gate(permissions));
    }

    /**
     * Get the Gate class.
     * @param app Application
     * @param log Winston
     * @returns {Gate}
     */
    getGateClass(app,log)
    {
        return class Gate
        {
            constructor(permissions)
            {
                this.permissions = permissions;
                this.policies = [];
            }

            /**
             * Add a gate to the queue.
             * @param policy function
             * @returns Gate
             */
            policy(policy)
            {
                if (typeof policy == 'function') {
                    log.debug("[Gate] Adding Policy: %s", policy.name);
                    this.policies.push(policy);
                }
                return this;
            };

            /**
             * Check if the gate has the permission stored.
             * @param key
             * @returns {*|boolean}
             */
            contains(key)
            {
                return this.permissions.indexOf(key) > -1;
            };

            /**
             * Check if a user has permission.
             * @param user User model
             * @param object string
             * @param action string
             * @param args mixed - optional
             * @returns {boolean}
             */
            check(user,object,action,args)
            {
                for (let i=0; i<this.policies.length; i++)
                {
                    var passed = this.policies[i].call(this,user,object,action,args);
                    if (typeof passed === 'boolean') {
                        return passed;
                    }
                }
                return true;
            };
        }
    }
}

module.exports = new GateProvider();