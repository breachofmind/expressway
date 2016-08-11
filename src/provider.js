"use strict";

var noop = function(){};

class Provider
{
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

    loadDependencies()
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
            provider.load();

        }.bind(this));
    }

    /**
     * Specify the provider(s) that this provider depends on.
     * @param providers array|string
     * @returns Provider
     */
    requires(providers)
    {
        if (! Array.isArray(providers)) {
            providers = [providers];
        }
        this.dependencies = this.dependencies.concat(providers);

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
    load()
    {
        var app = Provider._app;

        if (this.isLoadable(app.env))
        {
            app.event.emit('provider.loading', this);
            this.loadDependencies();
            this._register.call(this,app);
            this.loaded = true;
            app._providers.push(this.name);
            app.event.emit('provider.loaded', this);

            return true;
        }
        return false;
    }

    /**
     * Load all the providers.
     * Returns an array of the loaded providers in the order they were loaded.
     * @param app Application
     * @returns {array}
     */
    static loadAll(app)
    {
        Provider._app = app;

        // Load the user providers.
        Provider._loadAllFromConfig(app);

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
     * Loads any providers specified by the user in the config file.
     * @param app
     */
    static _loadAllFromConfig(app)
    {
        if (app.config.providers && app.config.providers.length) {
            app.config.providers.forEach(function(providerName) {
                try {
                    require(app.rootPath('providers/'+providerName)) (Provider);
                } catch(err){
                    console.error('Application Provider missing: '+providerName);
                }
            })
        }
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

Provider.queue = [];
Provider.objects = {};

module.exports = Provider;