"use strict";

var Expressway = require('expressway');
var _ = require('lodash/string');
var URL = require('url');
var path = require('path');
var fs = require('fs');

/**
 * Provides a URL helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CoreProvider extends Expressway.Provider
{
    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        app.call(this,'getURLServices');
        app.call(this,'getPathServices');
    }

    /**
     * Set up the URL services.
     * @param app Application
     */
    getURLServices(app)
    {
        var appUrl = URLService(app);

        // Attach to the application.
        app.register('url', appUrl, "Function for returning the url/proxy url");

        app.register('domain', appUrl.hostname, "The server or proxy domain name");
    }

    /**
     * Set up the path service.
     * @param app Application
     */
    getPathServices(app)
    {
        var pathService = new PathService;
        var paths = {
            resource:   "resources_path",
            view:       "views_path",
            controller: "controllers_path",
            model:      "models_path",
            provider:   "providers_path",
            locale:     "locales_path",
            public:     "static_path",
            db:         "db_path",
            logs:       "logs_path"
        };

        // Set up a path function for each path listed in the config.
        Object.keys(paths).forEach(pathName => {
            var value = app.config[paths[pathName]];
            if (value) {
                pathService.set(pathName, app.rootPath(app.config[paths[pathName]]), true);
            }
        });

        app.register('path', pathService, "A helper service for returning paths to files in the application");
    }
}

/**
 * Helper service for creating paths to files in the application.
 */
class PathService
{
    constructor()
    {
        this._paths = {};
    }

    /**
     * Create a new path method.
     * @param pathName string
     * @param dir string
     * @param createPath boolean
     * @returns string
     */
    set(pathName, dir, createPath=false)
    {
        var setPath = _.trimEnd(path.normalize( dir ), "/");

        // Create the path if it doesn't exist.
        if (createPath && ! fs.existsSync(setPath)) fs.mkdirSync(setPath);

        this._paths[pathName] = setPath;

        this[pathName] = (uri) => {
            return this.path(pathName, uri);
        };

        return setPath;
    }

    /**
     * Create a path to the given uri.
     * @param pathName string
     * @param uri string
     * @returns {string}
     */
    path(pathName, uri="")
    {
        if (! this._paths[pathName]) {
            throw new Error(`Path name "${pathName}" is not set`);
        }
        return this._paths[pathName] + "/" + uri;
    }
}

/**
 * Service for parsing the base URL and returning a url relative to the base url.
 * @param app Application
 * @returns {applicationUrl}
 */
function URLService(app)
{
    var config = app.config;

    // Set up a service to return the application URL.
    var baseurl = _.trimEnd(config.proxy ? config.proxy : config.url + ":" +config.port, "/");

    /**
     * Return a url to the given path.
     * @return string
     */
    function applicationUrl (uri)
    {
        if (!uri) uri = "";
        uri = _.trim(uri,"/");
        return `${baseurl}/${uri}`;
    }

    var parsed = URL.parse(baseurl);
    Object.keys(parsed).map(key => {
        applicationUrl[key] = parsed[key];
    });

    return applicationUrl;
}



module.exports = CoreProvider;