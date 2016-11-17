"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var _ = require('lodash');
var debug = app.get('debug');
var modelService = app.get('modelService');


/**
 * Gate class
 * @author Mike Adamczyk <mike@bom.us>
 */
class Gate
{
    /**
     * Constructor.
     * @param permissions Array
     */
    constructor()
    {
        this.policies = {};
    }

    /**
     * Check if the gate allows the user to proceed given the ability and object.
     * @param user User
     * @param object mixed
     * @param ability string
     * @returns {boolean}
     */
    allows(user, object, ability)
    {
        if (typeof object === 'string' && modelService.has(object)) {
            object = modelService.get(object);
        }
        var policy = object instanceof Expressway.Model
            ? this.policy(object.name)
            : this.policy(ability);

        if (! policy) {
            return false;
        }

        if (policy instanceof Expressway.Policy) {
            if (typeof policy.before == 'function') {
                let passed = app.call(policy, 'before', [user, object, ability]);
                if (typeof passed === 'boolean') {
                    return passed;
                }
            }
            if (typeof policy[ability] !== 'function') {
                throw new Error(`Policy method ${policy.name}.${ability} does not exist`);
            }
            return app.call(policy, ability, [user, object, ability]);
        }

        return app.call(policy,null,[user,object, ability]);
    }

    /**
     * Define a custom policy.
     * @param ability string
     * @param policy function|Policy
     * @returns {Gate}
     */
    define(ability, policy)
    {
        this.policies[ability] = policy;
        debug(this, "Policy defined: %s.%s", policy.name, ability);
        return this;
    }

    /**
     * Get a policy.
     * @param name string
     * @returns {Policy|Function}
     */
    policy(name)
    {
        if (! this.policies.hasOwnProperty(name)) {
            throw new Error(`Policy "${name}" does not exist`);
        }
        return this.policies[name];
    }
}

module.exports = Gate;