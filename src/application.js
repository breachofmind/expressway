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
        this.classes       = {};

        /**
         * Event emitter class.
         * @type {*|EventEmitter|d}
         */
        this.event = new events.EventEmitter();
        this.config = expressway.config;
        this.env = expressway.env;

        this.register('Event', this.event);
    }


    /**
     * Initial setup of the server.
     * @param providers array, optional
     * @returns Application
     */
    bootstrap(providers)
    {
        if (! providers) providers = this.config.providers;

        providers = Provider.check(providers);

        if (! this._booted)
        {
            utils.callOnEach(providers, 'load', this);

            this.event.emit('providers.registered', this);

            this._booted = true;

            this.event.emit('application.bootstrap', this);
        }
        return this;
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
     * Register a singleton object.
     * @param name
     * @param instance
     * @returns {Application}
     */
    register(name, instance)
    {
        if (this.classes.hasOwnProperty(name)) {
            throw new Error (`"${name}" class has already been defined`);
        }
        this.classes[name] = instance;
        if (instance instanceof Provider) {
            instance.register.apply(instance, instance.getInjectables(this));
            this.providers[name] = instance;
        }
        return this;
    }

    /**
     * Get a provider or class instance by name.
     * @param className string
     * @returns {Provider|object|null}
     */
    get(className)
    {
        if (this.classes.hasOwnProperty(className)) {
            return this.classes[className];
        }
        return null;
    }
}



module.exports = Application;