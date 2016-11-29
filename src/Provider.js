"use strict";

var assert = require('assert');

/**
 * Provider class.
 * For adding or modifying functionality to the application.
 * @constructor
 */
class Provider
{
    /**
     * Create an instance of a provider.
     * @param app Application
     */
    constructor(app)
    {
        this.app            = app;
        this.name           = this.constructor.name;

        this._active         = true;
        this._loaded         = false;
        this._booted         = false;
        this._order          = 1;
        this._requires       = [];
        this._environments   = ENV_ALL;
        this._contexts       = CXT_ALL;
        this._events         = {};
    }

    /**
     * Get/set the order.
     * @param n Number
     * @returns {Provider|Number}
     */
    order(n)
    {
        if (! arguments.length) return this._order;
        assert.equal(typeof n, 'number');
        this._order = n;
        return this;
    }

    /**
     * Set the dependencies for this provider.
     * If passing array, override the current set dependencies.
     * Pass separate arguments to append to the current dependency set.
     * @returns {Provider|Array}
     */
    requires()
    {
        if (! arguments.length) return this._requires;
        this._requires = Array.isArray(arguments[0]) ? arguments[0] : this._requires.concat(...arguments);
        return this;
    }
    /**
     * Get/set the environments.
     * @returns {Provider|Array}
     */
    environments()
    {
        if (! arguments.length) return this._environments;
        this._environments = Array.isArray(arguments[0]) ? arguments[0] : this._environments.concat(...arguments);
        return this;
    }

    /**
     * Get/set the contexts.
     * @returns {Provider|Array}
     */
    contexts()
    {
        if (! arguments.length) return this._contexts;
        this._contexts = Array.isArray(arguments[0]) ? arguments[0] : this._contexts.concat(...arguments);
        return this;
    }

    /**
     * Get/set the events property.
     * @param obj Object
     * @returns {Provider|object}
     */
    events(obj)
    {
        if (! arguments.length) return this._events;

        assert.equal(typeof obj, 'object');

        Object.keys(obj).forEach(eventName => {
            this._events[eventName] = obj[eventName];
        });

        return this;
    }

    /**
     * Does the provider have events listed?
     * @returns {boolean}
     */
    get hasEvents() {
        return Object.keys(this._events).length > 0;
    }

    /**
     * Get/set the active property.
     * @param boolean
     * @returns {Provider|boolean}
     */
    active(boolean)
    {
        if (! arguments.length) return this._active;
        assert.equal(typeof boolean, 'boolean');
        this._active = boolean;
        return this;
    }

    /**
     * Get/set the loaded property.
     * @param boolean
     * @returns {Provider|boolean}
     */
    loaded(boolean)
    {
        if (! arguments.length) return this._loaded;
        assert.equal(typeof boolean, 'boolean');
        this._loaded = boolean;
        return this;
    }

    booted(boolean)
    {
        if (! arguments.length) return this._booted;
        assert.equal(typeof boolean, 'boolean');
        this._booted = boolean;
        return this;
    }

    /**
     * If a provider has events listed, attach them to the app.
     * @param app Application
     * @returns {boolean}
     */
    attachEvents(app)
    {
        if (! this.hasEvents) {
            return false;
        }
        var provider = this;
        Object.keys(this._events).forEach(eventName => {
            var method = this._events[eventName];
            app.once(eventName, function() {
                app.call(provider, method)
            });
        });
        return true;
    }

    /**
     * Called when all providers have been instantiated.
     * @returns {null}
     */
    register()
    {
        return null;
    }

    /**
     * Called when all providers have been registered.
     * @returns {null}
     */
    boot()
    {
        return null;
    }

    /**
     * Check if this provider can be loaded.
     * @param env {string}
     * @param context {string}
     * @returns {boolean}
     */
    isLoadable(env, context)
    {
        var inEnvironment = this._environments.indexOf(env) > -1;
        var inContext =  this._contexts.indexOf(context) > -1;

        return this._active && inEnvironment && inContext;
    }

    /**
     * Return a native value of the object.
     * @returns {String}
     */
    toValue()
    {
        return this.name;
    }

    /**
     * Return this object as a string.
     * @returns {String}
     */
    toString()
    {
        return this.name;
    }
}

module.exports = Provider;