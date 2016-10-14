"use strict";

var Expressway = require('expressway');

var _string  = require('lodash/string');
var columnify = require('columnify');
var colors = require('colors');

/**
 * Provides a Command Line interface module.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CLIProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider'
        ];

        this.environments = [ENV_CLI];
    }

    /**
     * Register the provider
     * with the application.
     * @param app Application
     */
    register(app)
    {
        var CLI = require('./classes/CLI');

        app.register('cli', app.call(CLI), "The CLI class instance");

        app.call(this,'setDefaultActions');
    }

    /**
     * Give the CLI class some default actions.
     */
    setDefaultActions(app,cli)
    {
        /**
         * Create a new model, controller or provider.
         * @usage ./bin/cli new model ModelName
         */
        cli.action('new', function(env,opts)
        {
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = app.path(type+"s_path", type+"s") + opts +".js";

            this.cli.template(templateFile, destFile , {name:opts, _:_string});

            process.exit(1);
        });

        /**
         * List all the routes in the application.
         * @usage ./bin/cli routes
         */
        cli.action('routes', function(env,opts)
        {
            var router = app.get('router');
            var columns = router.routes.map(function(route) {
                var verbColor = colors.gray;
                switch (route.verb) {
                    case "post": verbColor = colors.green; break;
                    case "delete": verbColor = colors.red; break;
                    case "put": verbColor = colors.magenta; break;
                }
                return {
                    index: route.index,
                    verb: verbColor(route.verb.toUpperCase()),
                    url: route.url,
                    middleware: colors.blue(route.methods.length)
                }
            });
            console.log(columnify(columns));
            process.exit(1);
        });

        /**
         * List all the services in the application.
         * @usage ./bin/cli services
         */
        cli.action('services', function(env,opts)
        {
            var serviceNames = Object.keys(app.services).sort((a,b) => {
                return a.localeCompare(b);
            });
            var columns = serviceNames.map(function(key) {
                var svc = app.services[key];
                var doc = app.documentation[key] || "-";
                var type = typeof svc;
                if (type == 'function') type = svc.name || type;
                return {
                    type: colors.gray(type),
                    service: colors.green(key),
                    value: type == 'string' ? colors.blue(svc) : "",
                    description: doc,
                }
            });
            console.log(columnify(columns));
            process.exit(1);
        });
    }
}

module.exports = CLIProvider;