"use strict";

var noop = function(){};

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
     * @param boot func
     */
    constructor(name, boot)
    {
        this.name = name;
        this.active = true;
        this.loaded = false;
        this.dependencies = [];
        this.environments = [];
        this.order = 1;

        var register = boot.call(this);
        this._register = typeof register == 'function' ? register : noop;

        Provider.queue.push(this);
        Provider.objects[name] = this;
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
    runIn(environments)
    {
        this.environments = this.dependencies.concat(environments);
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
        this._register.call(this,app);
        this.loaded = true;

        app._providers.push(this.name);
        app.event.emit('provider.loaded', this);

        return true;
    }

    /**
     * Load all the providers.
     * Returns an array of the loaded providers in the order they were loaded.
     * @param app Application
     * @returns {array}
     */
    static loadAll(app)
    {
        Provider.queue.sort(function(a,b) {
            return a.order == b.order ? 0 : (a.order > b.order ? 1: -1);
        });
        Provider.queue.forEach(function(provider){
            provider.load(app);
        });
        app.event.emit('provider.registered', app, Provider.objects);

        return app._providers;
    }

    /**
     * Runs the module functions, which creates the provider instances.
     * @param arr array<function>
     * @returns {Number}
     */
    static modules(arr)
    {
        arr.forEach(function(module) {
            if (typeof module == 'function') module(Provider);
        });
        return arr.length;
    }

    /**
     * Named constructor.
     * @param name string unique provider name
     * @param register function
     * @returns {Provider}
     */
    static create(name,register)
    {
        return new Provider(name,register);
    }

    /**
     * Get a provider by name.
     * @param name string
     * @returns {Provider|null}
     */
    static get(name)
    {
        return Provider.objects[name] || null;
    }
}

/**
 * The queue of providers to load.
 * @type {Array}
 */
Provider.queue = [];

/**
 * An index of providers by name.
 * @type {{}}
 */
Provider.objects = {};

module.exports = Provider;