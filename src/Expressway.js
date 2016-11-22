"use strict";

var path            = require('path');
var Application     = require('./Application');
var utils           = require('./support/utils');
var _               = require('lodash');

global.ApplicationError = require('./exceptions/ApplicationError');
global.ApplicationCallError = require('./exceptions/ApplicationCallError');

/**
 * The Express MVC application.
 * @constructor
 */
class Expressway
{
    constructor(rootPath,configPath=null)
    {
        /**
         * The root path of the application.
         * @type {string}
         * @private
         */
        this._rootPath = rootPath;

        /**
         * Path where configuration files are kept.
         * @type {string}
         * @private
         */
        this._configPath = configPath || rootPath+'config/';

        /**
         * The Application instance.
         * @type {null|Application}
         * @private
         */
        this._app = null;

        /**
         * Paths to locate provider modules.
         * @type {{}}
         * @private
         */
        this._providerPaths = {};
    }

    /**
     * Create an instance of the Application class.
     * @param context
     * @returns {Expressway}
     */
    createApplication(context = CXT_WEB)
    {
        var appConfig = require(this._configPath + "config");
        var sysConfig = require(this._configPath + "system");

        this._providerPaths['User'] = this.rootPath(appConfig.providers_path +"/");
        this._providerPaths['System'] = __dirname+'/providers/';

        // Merge the provider classes with the config.
        let providerList = {};
        Object.keys(this._providerPaths).forEach(key => {
            providerList[key] = utils.getModulesAsHash(this._providerPaths[key], true);
        });

        _.merge(appConfig, sysConfig(providerList));

        this._app = new Application(this,appConfig,context);

        return this;
    }

    /**
     * Return the Expressway app instance, if loaded.
     * @returns {Application|null}
     */
    static get app()
    {
        return Expressway.instance.app;
    }

    /**
     * Get the protected Application instance.
     * @returns {null|Application}
     */
    get app()
    {
        return this._app;
    }

    /**
     * Get the root path to a file.
     * @param filePath string
     * @returns {string}
     */
    rootPath(filePath="")
    {
        return path.normalize( this._rootPath + filePath );
    }

    /**
     * Bootstrap the application.
     * @returns {Application}
     */
    bootstrap()
    {
        return this._app.bootstrap();
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
     * @param configPath string, optional
     * @returns {Expressway}
     */
    static init(rootPath, context, configPath=null)
    {
        // Return the instance if it exists already.
        if (Expressway.instance) return Expressway.instance;

        var instance = new Expressway(rootPath,configPath);

        instance.createApplication(context);

        return Expressway.instance = instance;
    }
}


Expressway.instance         = null;
Expressway.Promise          = require('bluebird');
Expressway.BaseModel        = require('./Model');
Expressway.Provider         = require('./Provider');
Expressway.Driver           = require('./Driver');
Expressway.Module           = require('./Module');
Expressway.Application      = Application;
Expressway.utils            = utils;

module.exports = Expressway;