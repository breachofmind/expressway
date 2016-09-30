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
        this.order          = 1;
        this.requires       = [];
        this.environments   = [];
    }

    /**
     * Stub for provider extensions.
     * Called when all providers have been loaded.
     * @returns {null}
     */
    register()
    {
        return null;
    }


    /**
     * Check if this provider can be loaded.
     * @returns {boolean}
     */
    isLoadable(env)
    {
        var inEnvironment = !this.environments.length ? true : this.environments.indexOf(env) > -1;

        return this.active && !this.loaded && inEnvironment;
    }
}

module.exports = Provider;