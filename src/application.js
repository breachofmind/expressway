"use strict";

// Environment constants.
GLOBAL.ENV_LOCAL = 'local';
GLOBAL.ENV_DEV   = 'development';
GLOBAL.ENV_PROD  = 'production';
GLOBAL.ENV_CLI   = 'cli';
GLOBAL.ENV_TEST  = 'test';

var path     = require('path');
var events   = require('events');
var Provider = require('./provider');
var utils    = require('./support/utils');

/**
 * The default application root directory.
 * This is where the config, routes, models and controller files are located.
 * @type {string}
 */
var rootPath = path.normalize(path.dirname(__dirname) + "/app/");

/**
 * The package.json object.
 * @type {*|Object}
 */
var npmPackage = utils.readJSON(__dirname+'/../package.json');


/**
 * The application class sets up the entire stack.
 * @constructor
 */
class Application
{
    /**
     * Constructor.
     * @param config object
     * @param env string
     * @returns Application
     */
    constructor(config, env)
    {
        this.booted   = false;
        this.config   = config;
        this.version  = npmPackage.version;
        this.event    = new events.EventEmitter();
        this.env      = env || this.config.environment;
        this.rootPath = Application.rootPath;
        this.utils    = utils;

        /**
         * The NPM package.json.
         * @type {*|Object}
         * @private
         */
        this._package = npmPackage;

        /**
         * Loaded providers.
         * @type {Array} of strings
         * @private
         */
        this._providers = [];
    }


    /**
     * Initial setup of the server.
     * @returns Application
     */
    bootstrap()
    {
        if (! this.booted)
        {
            Provider.boot(this.config.providers, this);

            this.event.emit('application.bootstrap', this);

            this.booted = true;
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
     * Return a path relative to the public path.
     * @param filepath string
     * @returns {string}
     */
    publicPath(filepath)
    {
        return this.rootPath(`../${this.config.static_path}/${filepath}`);
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
     * Return a path relative to the root path.
     * @param filepath string
     * @returns {string}
     */
    static rootPath(filepath)
    {
        return path.normalize(rootPath+"/"+(filepath||""));
    }

    /**
     * Set the root path to your application.
     * @param dir string
     * @returns string
     */
    static setRootPath(dir)
    {
        return rootPath = dir;
    }

    /**
     * Destroy the application and connections.
     * @returns void
     */
    destruct()
    {
        this.event.emit('application.destruct');
    }

    /**
     * Get a provider by name.
     * Providers can have configurations or objects attached to them.
     * @param providerName string
     * @returns {Provider|null}
     */
    get(providerName)
    {
        return Provider.get(providerName);
    }
}

module.exports = Application;