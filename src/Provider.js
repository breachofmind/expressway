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
        this.active         = true;
        this.loaded         = false;
        this.booted         = false;
        this.order          = 1;
        this.requires       = [];
        this.environments   = ENV_ALL;
        this.contexts       = CXT_ALL;
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

        return this.active && inEnvironment && inContext;
    }
}

module.exports = Provider;