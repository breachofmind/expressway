"use strict";

var path     = require('path');
var events   = require('events');
var Provider = require('./provider');
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

        this.providers     = {};
        this.services      = {};

        /**
         * Event emitter class.
         * @type {*|EventEmitter|d}
         */
        this.event = new events.EventEmitter();
        this.config = expressway.config;
        this.env = expressway.env;

        this.register('events', this.event);
    }


    /**
     * Initial setup of the server.
     * @param providers array, optional
     * @returns Application
     */
    bootstrap(providers)
    {
        if (! providers) providers = this.config.providers;

        var checkedProviders = Provider.check(providers);

        if (! this._booted)
        {
            for(let i=0; i<checkedProviders.length; i++) {
                this.load(checkedProviders[i]);
            }

            this.event.emit('providers.registered', this);

            this._booted = true;

            this.event.emit('application.bootstrap', this);
        }
        return this;
    }

    /**
     * Boot a provider into the application.
     * @param provider Provider
     * @returns {boolean}
     */
    load(provider)
    {
        if (! provider.isLoadable(this.env)) {
            return false;
        }

        this.event.emit('provider.loading', provider);

        // Load any dependencies first.
        for (let i=0; i<provider.requires.length; i++)
        {
            var dependency = Provider.get(provider.requires[i]);

            // This provider wasn't created.
            if (! dependency) {
                throw (`Provider ${provider.name} is missing a dependency: ${provider.requires[i]}`);
            }
            if (! dependency.active) {
                throw (`Provider ${provider.name} dependency needs to be loadable: ${dependency.name}`);
            }
            this.load(dependency);
        }

        // Call provider.register() with any services
        this.call(provider,"register",[this].concat(provider.inject));

        this.providers[provider.name] = provider;

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
     * Call a method with the services injected.
     * @param context object
     * @param method string
     * @param services array
     * @returns {*}
     */
    call(context,method,services)
    {
        if (! context) {
            throw new Error("Context missing for method "+method);
        }
        return context[method].apply(context, this.getServices(services));
    }

    /**
     * Given the array of string service/provider names,
     * resolve the registered objects.
     * @param array
     * @returns {Array}
     */
    getServices(array)
    {
        if (! Array.isArray(array)) array = [];
        return array.map(function(service) {
            return typeof service == 'string' ? this.get(service) : service;
        }.bind(this))
    }

    /**
     * Get a provider or class instance by name.
     * @param service string
     * @returns {Provider|object|null}
     */
    get(service)
    {
        if (this.services.hasOwnProperty(service)) {
            return this.services[service];
        }
        return null;
    }
}



module.exports = Application;