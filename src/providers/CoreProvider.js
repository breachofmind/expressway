"use strict";

var Expressway = require('expressway');

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
    }

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
        var appUrl = require('../services/URLService')(app);

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
        var PathService = require('../services/PathService');
        var pathService = new PathService;
        var paths = {
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
        };

        pathService.set('root', app.rootPath());

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



module.exports = CoreProvider;