"use strict";

var path     = require('path');
var events   = require('events');
var Provider = require('./Provider');
var utils    = require('./support/utils');


/**
 * The application class sets up the entire stack.
 * @constructor
 */
class Application
{
    /**
     * Constructor.
     * @param expressway Expressway
     * @returns Application
     */
    constructor(expressway)
    {
        this._expressway    = expressway;
        this._booted        = false;
        this._package       = require(__dirname+'/../package.json');
        this._version       = this._package.version;
        this._order         = [];

        this.providers     = {};
        this.services      = {};

        /**
         * Event emitter class.
         * @type {*|EventEmitter}
         */
        this.event = new events.EventEmitter();
        this.config = expressway.config;
        this.env = expressway.env;

        this.register('app', this);
        this.register('event', this.event);
    }


    /**
     * Initial setup of the server.
     * @param providers array, optional
     * @returns Application
     */
    bootstrap(providers)
    {
        if (this._booted) return this;

        if (! providers) providers = this.config.providers;

        // Instantiate and index all providers first.
        var objects = providers.map(function(ProviderClass) {
            try {
                var instance = new ProviderClass(this);
                this.providers[instance.name] = instance;
            } catch (e) {
                console.error(ProviderClass);
                throw (e);
            }

            return instance;
        }.bind(this)).sort(function ascending(a,b) {
            return a.order == b.order ? 0 : (a.order > b.order ? 1: -1);
        });

        // Register all providers and their dependencies.
        objects.forEach(function(provider) {
            this.load(provider);
        }.bind(this));

        this.event.emit('providers.registered', this);

        this._booted = true;

        this.event.emit('application.bootstrap', this);

        return this;
    }

    /**
     * Boot a provider into the application.
     * @param provider Provider
     * @returns {boolean}
     */
    load(provider)
    {
        if (! provider.isLoadable(this.env)) return false;

        this.event.emit('provider.loading', provider);

        // Load any dependencies first.
        provider.requires.forEach(function(dependencyName)
        {
            var dependency = this.providers[dependencyName];

            if (! dependency) {
                throw (`Provider ${provider.name} is missing a dependency: ${dependencyName}`);
            }
            if (! dependency.active) {
                throw (`Provider ${provider.name} dependency needs to be active: ${dependency.name}`);
            }
            this.load(dependency);

        }.bind(this));

        // Call provider.register() with any services
        this.call(provider,"register");

        this._order.push(provider.name);

        provider.loaded = true;

        this.event.emit('provider.loaded', provider);

        return true;
    }



    /**
     * Start the application server.
     * @param listening function, optional
     * @returns Application
     */
    server(listening)
    {
        this.event.emit('application.server', this);

        if (typeof listening == 'function') listening(this);

        return this;
    };

    /**
     * Return a path relative to the root path.
     * @param filepath string
     * @returns {string}
     */
    rootPath(filepath)
    {
        return this._expressway.rootPath(filepath);

    }

    /**
     * Return a path relative to the public path.
     * @param filepath string
     * @returns {string}
     */
    publicPath(filepath)
    {
        return this.path('static_path', '../public') + (filepath || "");
    }

    /**
     * Return a path relative to the rootPath.
     * @param conf string key from the config, ie resources_path
     * @param defaultPath string
     * @returns {string}
     */
    path(conf,defaultPath)
    {
        return this.rootPath( this.conf(conf,defaultPath) ) + "/";
    }

    /**
     * Reach into the configuration.
     * @param key string
     * @param defaultValue mixed
     * @returns {*}
     */
    conf(key,defaultValue)
    {
        if (this.config[key]) {
            return this.config[key];
        }
        return defaultValue;
    }



    /**
     * Destroy the application and connections.
     * @returns void
     */
    destruct()
    {
        this._booted = false;
        this._providers = [];
        this.event.emit('application.destruct');
        this.event.removeAllListeners();
    }

    /**
     * Register a service or other object.
     * @param name {string}
     * @param instance mixed
     * @returns {Application}
     */
    register(name, instance)
    {
        if (this.services.hasOwnProperty(name)) {
            throw new Error (`"${name}" service has already been defined`);
        }
        this.services[name] = instance;
        return this;
    }

    /**
     * Call a method or function with the services injected.
     * The function arguments should be the service names.
     * Example: this.register(db,Models)
     * @param context object|function
     * @param method string
     * @param args Array - optional arguments
     * @returns {*}
     */
    call(context,method,args)
    {
        if (! context) {
            throw new Error("Context missing for method "+method);
        }
        if (typeof context === 'function') {
            if (context.constructor) {
                var svc = this.injectServices(context.prototype.constructor, args);
                return new context(...svc);
            }
            return context.apply(context, this.injectServices(context, args));
        }
        return context[method].apply(context, this.injectServices(context[method], args));
    }

    /**
     * Given the array of string service/provider names,
     * resolve the registered objects.
     * @param array
     * @param args array
     * @returns {Array}
     */
    getServices(array,args)
    {
        if (! args) args = [];
        if (! Array.isArray(array)) array = [];

        return array.map(function(serviceName,i) {
            if (args[i]) return args[i];
            var service = this.get(serviceName);
            if (! service) {
                throw new Error("Service does not exist: " + serviceName);
            }
            return service;
        }.bind(this))
    }

    /**
     * Inject services into a function.
     * @param fn function
     * @param args array
     * @returns {Array}
     */
    injectServices(fn,args)
    {
        var names = utils.annotate(fn);
        return this.getServices(names,args);
    }

    /**
     * Get a provider or class instance by name.
     * @param service string
     * @returns {Provider|object|null}
     */
    get(service)
    {
        return this.has(service) ? this.services[service] : null;
    }

    /**
     * Check if a service is loaded.
     * @param service name
     * @returns {boolean}
     */
    has(service)
    {
        return this.services.hasOwnProperty(service);
    }

    /**
     * Get the Expressway version.
     * @returns {string}
     */
    getVersion()
    {
        return this._version;
    }
}



module.exports = Application;