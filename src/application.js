"use strict";

// Environment constants.
GLOBAL.ENV_LOCAL = 'local';
GLOBAL.ENV_DEV = 'development';
GLOBAL.ENV_PROD = 'production';
GLOBAL.ENV_CLI = 'cli';

var path   = require('path'),
    events = require('events'),
    cp     = require('child_process');

/**
 * The default application root directory.
 * This is where the config, routes, models and controller files are located.
 * @type {string}
 */
var rootPath = path.normalize(path.dirname(__dirname) + "/app/");

var Provider = require('./provider');
var utils = require('./support/utils');

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
        Application.instance = this;

        this.config   = config;
        this.version  = npmPackage.version;
        this.event    = new events.EventEmitter();
        this.env      = env || this.config.environment;
        this.rootPath = Application.rootPath;
        this.utils    = utils;

        this._package = npmPackage;
        this._providers = [];
    }

    /**
     * Initial setup of the server.
     * @returns Application
     */
    bootstrap()
    {
        Provider.loadAll(this);

        this.event.emit('application.bootstrap', this);

        return this;
    }


    /**
     * Start the application server.
     * @returns Application
     */
    server()
    {
        this.event.emit('application.server', this);

        // Boot google chrome if developing locally.
        if (this.env == GLOBAL.ENV_LOCAL) {
            cp.exec(`open /Applications/Google\\ Chrome.app ${utils.url()}`, function(err){});
        }
        return this;
    };

    /**
     * Return a path relative to the public path.
     * @param filepath string
     * @returns {string}
     */
    publicPath(filepath)
    {
        return this.rootPath(`../${this.config.static_uri}/${filepath}`);
    }

    /**
     * Named constructor.
     * @param config object
     * @param env string
     * @returns {Application}
     */
    static create(config,env)
    {
        if (Application.instance) {
            return Application.instance;
        }
        return new Application(config,env);
    }

    /**
     * Return a path relative to the root path.
     * @param filepath string
     * @returns {string}
     */
    static rootPath(filepath)
    {
        return path.normalize(rootPath+"/"+filepath);
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

/**
 * The Application singleton object.
 * @type {Application}
 */
Application.instance = null;


module.exports = Application;