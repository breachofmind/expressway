"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var log = app.get('log');

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
    constructor(permissions)
    {
        this.permissions = permissions;
        this.policies = [];
    }

    /**
     * Add a gate to the queue.
     * @param name string
     * @param policy function
     * @returns Gate
     */
    policy(name, policy)
    {
        this.policies.push ( new Policy(name,policy,this) );
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
            var passed = this.policies[i].check(user,object,action,args);
            if (typeof passed === 'boolean') {
                return passed;
            }
        }
        return true;
    };
}

/**
 * Policy class.
 */
class Policy
{
    constructor(name,method,gate)
    {
        this.gate = gate;
        this.name = name;
        this.method = method;

        log.debug("[Gate] Adding Policy: %s", this.name);
    }

    check(user,object,action,args)
    {
        var passed = this.method.apply(this.gate, [user,object,action,args]);
        if (typeof passed === 'boolean') {
            return passed;
        }
        return null;
    }
}

module.exports = Gate;