"use strict";

var path            = require('path');
var Application     = require('./Application');
var Provider        = require('./Provider');
var DriverProvider  = require('./DriverProvider');
var Model           = require('./Model');
var utils           = require('./support/utils');

global.ApplicationError = require('./exceptions/ApplicationError');
global.ApplicationCallError = require('./exceptions/ApplicationCallError');

/**
 * The Express MVC application.
 * @constructor
 */
class Expressway
{
    constructor(rootPath, config, context)
    {
        /**
         * The root path of the application.
         * @type {string}
         * @private
         */
        this._rootPath = rootPath;

        /**
         * The configuration file.
         * @type {{}}
         */
        this.config = config;

        /**
         * The default environment.
         * @type {string}
         */
        this.env = config.environment;

        /**
         * The environment context.
         * @type {string}
         */
        this.context = context || CXT_WEB;

        /**
         * The Application instance.
         * @type {null|Application}
         */
        this.app = new Application(this);

        var systemProviders = utils.getModulesAsHash(__dirname+'/providers/', true);
        var userProviders = utils.getModulesAsHash(this.app.path('providers_path', 'providers'), true);

        var systemConfig = require(rootPath + 'config/system') (this.app, {Provider: systemProviders}, {Provider: userProviders});

        this.config.providers = systemConfig.providers;
        this.config.middleware = systemConfig.middleware;
    }

    /**
     * Get the root path to a file.
     * @param filePath string
     * @returns {string}
     */
    rootPath(filePath)
    {
        return path.normalize( this._rootPath + (filePath||"") );
    }

    /**
     * Bootstrap the application.
     * @returns {Application}
     */
    bootstrap()
    {
        return this.app.bootstrap();
    }

    /**
     * An alias to the CLI environment.
     * @param rootPath string
     * @returns {Application}
     */
    static cli(rootPath)
    {
        return Expressway.init(rootPath, CXT_CLI).bootstrap();
    }

    /**
     * Create a gulp helper object.
     * @param rootPath string
     * @param gulp Gulp
     * @returns {GulpHelper}
     */
    static gulp(rootPath,gulp)
    {
        let app    = Expressway.cli(rootPath);
        let Helper = require('./support/gulp');

        return new Helper(gulp);
    }

    /**
     * Initialize the application.
     * @param rootPath string
     * @param context string, optional
     * @returns {Expressway}
     */
    static init(rootPath, context)
    {
        // Return the instance if it exists already.
        if (Expressway.instance) return Expressway.instance;

        var config = require(rootPath + 'config/config');

        return Expressway.instance = new Expressway(rootPath, config, context);
    }
}

Expressway.instance         = null;
Expressway.BaseModel        = Model;
Expressway.Provider         = Provider;
Expressway.DriverProvider   = DriverProvider;
Expressway.Application      = Application;
Expressway.utils            = utils;

module.exports = Expressway;