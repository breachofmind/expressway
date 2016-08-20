"use strict";

var noop = function(){};

var objects = {};

/**
 * Provider class.
 * For adding or modifying functionality to the application.
 * @constructor
 */
class Provider
{
    /**
     * Create an instance of a provider.
     * @param name string
     */
    constructor(name)
    {
        this.name           = name;
        this.active         = true;
        this.loaded         = false;
        this.dependencies   = [];
        this.environments   = [];
        this.order          = 1;

        objects[this.name] = this;
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
     * Loads the dependencies for this provider.
     * @param app Application
     */
    loadDependencies(app)
    {
        this.dependencies.forEach(function(providerName) {

            var provider = Provider.get(providerName);

            // This provider wasn't created.
            if (! provider) {
                throw (`Provider ${this.name} is missing a dependency: ${providerName}`);
            }
            if (! provider.active) {
                throw (`Provider ${this.name} dependency needs to be loadable: ${providerName}`);
            }
            // Load the provider.
            provider.load(app);

        }.bind(this));
    }

    /**
     * Specify the provider(s) that this provider depends on.
     * @param providers array|string
     * @returns Provider
     */
    requires(providers)
    {
        this.dependencies = this.dependencies.concat(providers);
        return this;
    }

    /**
     * Specify the environments(s) that this provider can run in.
     * @param environments array|string
     * @returns Provider
     */
    inside(environments)
    {
        this.environments = this.environments.concat(environments);
        return this;
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
     * Boot this provider into the application.
     * @returns {boolean}
     */
    load(app)
    {
        if (! this.isLoadable(app.env)) {
            return false;
        }

        app.event.emit('provider.loading', this);

        this.loadDependencies(app);
        this.register(app);
        this.loaded = true;

        app._providers.push(this.name);
        app.event.emit('provider.loaded', this);

        return true;
    }

    /**
     * Load all the providers.
     * Returns an array of the loaded providers in the order they were loaded.
     * @param providers array
     * @param app Application
     * @returns {array}
     */
    static boot(providers,app)
    {
        providers.sort(ascending);

        providers.forEach(function(provider){
            if (provider instanceof Provider) provider.load(app);
        });
        app.event.emit('provider.registered', app, objects);

        return app._providers;
    }

    /**
     * Get a provider by name or get all providers.
     * @param name string
     * @returns {Provider|{}|undefined}
     */
    static get(name)
    {
        return arguments.length ? objects[name] : objects;
    }
}

/**
 * Sort by ascending order.
 * @param a
 * @param b
 * @returns {number}
 */
function ascending(a,b) {
    return a.order == b.order ? 0 : (a.order > b.order ? 1: -1);
}


module.exports = Provider;