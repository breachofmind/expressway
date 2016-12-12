"use strict";

var Expressway = require('expressway');
var _ = require('lodash');

/**
 * Provides some basic core functions the application will need.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CoreProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.order(0);

        this.pathNames = {
            resources:   "resources_path",
            views:       "views_path",
            controllers: "controllers_path",
            middlewares: "middlewares_path",
            models:      "models_path",
            providers:   "providers_path",
            locales:     "locales_path",
            public:      "static_path",
            db:          "db_path",
            logs:        "logs_path",
            uploads:     "uploads_path",
        }
    }

    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        app.singleton('paths', require('../services/PathService'), "A helper service for returning paths to files in the application");

        app.call(this,'setupURLService');
        app.call(this,'setupPathService');
    }

    /**
     * Set up the URL services.
     * @param app Application
     */
    setupURLService(app)
    {
        var appUrl = require('../services/URLService')(app);

        app.register('url', appUrl, "Function for returning the url/proxy url");
        app.register('domain', appUrl.hostname, "The server or proxy domain name");
    }

    /**
     * Set up the path service.
     * @param app Application
     * @param paths PathService
     */
    setupPathService(app,paths)
    {
        paths.set('root', app.rootPath());

        // Set up a path function for each path listed in the config.
        _.each(this.pathNames, (value,pathName) =>
        {
            let str = app.config[value];
            if (str) paths.set(pathName, app.rootPath(str), true);
        });
    }
}



module.exports = CoreProvider;