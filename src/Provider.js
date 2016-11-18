"use strict";

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
     * Set the order property.
     * @param n {number}
     */
    set order(n) {
        this._order = typeof n != 'number' ? 1 : n;
    }

    /**
     * Get the order.
     * @returns {number}
     */
    get order() {
        return this._order;
    }

    /**
     * Set the required dependencies.
     * @param arr {String|Array}
     */
    set requires(arr) {
        this._requires = setArray(arr);
    }
    /**
     * Get the required dependencies.
     * @returns {String|Array}
     */
    get requires() {
        return this._requires;
    }

    /**
     * Get the protected environments array.
     * @returns {Array}
     */
    get environments() {
        return this._environments;
    }

    /**
     * Set the protected environments array.
     * @param arr {Array}
     */
    set environments(arr) {
        this._environments = setArray(arr);
    }


    /**
     * Return the protected contexts array.
     * @returns {Array}
     */
    get contexts() {
        return this._contexts;
    }

    /**
     * Set the protected contents array.
     * @param arr {Array}
     */
    set contexts(arr) {
        this._contexts = setArray(arr);
    }


    /**
     * Return the protected events object.
     * @returns {{}}
     */
    get events() {
        return this._events;
    }

    /**
     * Set the protected events object.
     * @param obj {{}}
     */
    set events(obj) {
        if (typeof obj == 'object') this._events = obj;
    }

    /**
     * Does the provider have events listed?
     * @returns {boolean}
     */
    get hasEvents() {
        return Object.keys(this._events).length > 0;
    }


    /**
     * Is the provider active?
     * @returns {boolean}
     */
    get active() {
        return this._active;
    }

    /**
     * Set the active property.
     * @param boolean {boolean}
     */
    set active(boolean) {
        this._active = typeof boolean != 'boolean' ? false : boolean;
    }

    /**
     * Is the provider loaded?
     * @returns {boolean}
     */
    get loaded() {
        return this._loaded;
    }

    /**
     * Set the loaded property.
     * @param boolean {boolean}
     */
    set loaded(boolean) {
        this._loaded = typeof boolean != 'boolean' ? false : boolean;
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
        var inEnvironment = this.environments.indexOf(env) > -1;
        var inContext =  this.contexts.indexOf(context) > -1;

        return this._active && inEnvironment && inContext;
    }
}

function setArray(arr) {
    if (typeof arr == 'string') arr = [arr];
    return arr;
}

module.exports = Provider;