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
        this.$inject        = [];

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
     * Get an array of objects specified as injectables.
     * @return array
     */
    getInjectables(app)
    {
        var classes = this.$inject.map(function(className) {
            return app.get(className);
        });
        return [app].concat(classes);
    }

    /**
     * Choose which class instances or providers to inject.
     * @param classes
     * @returns {Provider}
     */
    inject(classes)
    {
        this.$inject = this.$inject.concat(classes);
        return this;
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
        app.register(this.name, this);
        this.loaded = true;

        app.event.emit('provider.loaded', this);

        return true;
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

Provider.classes = {};

module.exports = Provider;