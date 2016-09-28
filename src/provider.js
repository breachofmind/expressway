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
     */
    constructor()
    {
        this.name           = this.constructor.name;
        this.active         = true;
        this.loaded         = false;
        this.requires       = [];
        this.environments   = [];
        this.order          = 1;
        this.inject         = [];

        Provider.classes[this.name] = this;
    }

    /**
     * Stub for provider extensions.
     * @param app Application
     * @returns {null}
     */
    register(app)
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


    /**
     * Get a provider by name or get all providers.
     * @param name string
     * @returns {Provider|{}|undefined}
     */
    static get(name)
    {
        return arguments.length ? Provider.classes[name] : Provider.classes;
    }

    /**
     * Given an array of providers, check if they are what they are supposed to be.
     * Return an array of providers sorted by their load order property.
     * @param providers array
     * @returns {Array}
     */
    static check(providers)
    {
        var out = [];

        providers.forEach(function(provider)
        {
            if (typeof provider == 'string') {
                provider = Provider.get(provider);
            }
            if (provider instanceof Provider) {
                return out.push(provider);
            }
            throw ("Provider given is not an instance of a Provider: "+provider);
        });

        out.sort(function ascending(a,b) {
            return a.order == b.order ? 0 : (a.order > b.order ? 1: -1);
        });

        return out;
    }
}

/**
 * An index of all created providers.
 * @type {{}}
 */
Provider.classes = {};

module.exports = Provider;