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

        this.contexts = [CXT_CLI];
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
     * @param app Application
     * @param cli CLI
     * @param log Winston
     */
    setDefaultActions(app,cli,log)
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
                    middleware: colors.blue(route.methods.map(method => { return method.$route; }).join(" -> "))
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

        /**
         * List all the providers in the application.
         * @usage ./bin/cli providers [environment] [context]
         */
        cli.action('providers', function(env,context) {

            var columns = Object.keys(app.providers).sort((a,b) => { return a.localeCompare(b); }).map(function(key) {
                var provider = app.providers[key];
                return {
                    name: colors.magenta(provider.name),
                    loaded: provider.isLoadable(env || ENV_ALL, context || CXT_ALL) ? colors.green("yes") : colors.red("no"),
                    envs: provider.environments,
                    contexts: provider.contexts.map(cxt => { return colors.gray(cxt); }),
                    dependencies: provider.requires
                }
            });
            console.log(columnify(columns));
            process.exit(1);
        });

        /**
         * Run the seeder.
         * @usage ./bin/cli seed
         */
        cli.action('seed', function(env,opts) {
            if (app.env == ENV_PROD) {
                log.warn("Seeding not allowed in production mode! Exiting.");
                return process.exit(1);
            }
            require(app.path('db_path', 'db') + "seeder");
        });
    }
}

module.exports = CLIProvider;