"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var _string  = require('lodash/string');
var columnify = require('columnify');
var colors = require('colors');
var _ = require('lodash');

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
            'LoggerProvider',
            'ControllerProvider'
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
        app.singleton('cli', __dirname+'/../classes/CLI', "The CLI Class instance");
    }

    /**
     * Give the CLI class some default actions.
     * @param app Application
     * @param cli CLI
     * @param log Winston
     * @param path PathService
     */
    boot(app,cli,log,path)
    {
        var LINE = Array(20).join("-")+"\n";
        /**
         * Create a new model, controller or provider.
         * @usage ./bin/cli new model ModelName
         */
        cli.command('new [class] <name>', "Create a new provider, controller or model").action((env,opts) =>
        {
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = path[type+"s"] (opts + ".js");

            cli.template(templateFile, destFile.toString() , {name:opts, _:_string});

            process.exit();
        });

        /**
         * List all the routes in the application.
         * @usage ./bin/cli routes
         */
        cli.command('routes', "List all routes and middleware in the application").action((env,opts) =>
        {
            app.stacks().forEach(application => {

                var columns = application.stack.map((route,i) =>
                {
                    var methods = route.methods.map(method => {
                        var name = method.toUpperCase();
                        switch (method) {
                            case "post": return colors.green(name);
                            case "delete": return colors.red(name);
                            case "put": return colors.magenta(name);
                            default: return colors.gray(name);
                        }
                    });

                    var routes = route.stack.map((name,i) => {
                        var c = i==route.stack.length-1 ? "white" : "gray";
                        return colors[c](name);
                    });
                    return {
                        index: i,
                        methods: methods.join(","),
                        base: colors.gray(`[${route.rx.flags}]`)+` ${route.rx.path}`,
                        path: route.path,
                        middleware: routes.join(" -> ")
                    }
                });

                console.log(colors.blue (`#${application.index}: ${application.name}`));
                console.log(columnify(columns));
                console.log(LINE);
            });

            process.exit();
        });

        /**
         * List all the services in the application.
         * @usage ./bin/cli services
         */
        cli.command('services', "List all services in the application").action((env,opts) =>
        {
            var conf = {
                description: {maxWidth:60}
            };
            var serviceNames = Object.keys(app.services).sort(utils.sortString());
            var columns = serviceNames.map(function(key) {
                var svc = app.services[key];
                var type = typeof svc.value;
                if (type == 'function') type = svc.value.name || type;
                return {
                    type: colors.gray(type),
                    service: colors.green(key),
                    value: typeof svc.value !== 'function' ? colors.blue(svc.value.toString()) : "",
                    description: svc.doc,
                    call: svc.call ? colors.red("true") : ""
                }
            });
            console.log(columnify(columns, {config:conf}));
            console.log(`\nRetrieve a service using ${colors.cyan('app.get("serviceName")')}`);
            process.exit();
        });

        /**
         * List all the providers in the application.
         * @usage ./bin/cli providers [environment] [context]
         */
        cli.command('providers [options]', "List all providers in the application loaded with the given environment and context")
            .option('-e, --environment [name]', "Providers loaded for given environment: local|dev|prod")
            .option('-c, --context [name]', "Providers loaded for given context: cli|web|test")
            .action((env,opts) =>
            {
                if (! opts.environment) opts.environment = app.env;
                if (! opts.context) opts.context = CXT_WEB;

                var columns = Object.keys(app.providers).sort((a,b) => { return a.localeCompare(b); }).map(function(key) {
                    var provider = app.providers[key];
                    return {
                        name: colors.magenta(provider.name),
                        loaded: provider.isLoadable(opts.environment, opts.context) ? colors.green("yes") : colors.red("no"),
                        envs: provider.environments,
                        contexts: provider.contexts.map(cxt => { return colors.gray(cxt); }),
                        dependencies: provider.requires
                    }
                });
                console.log(LINE);
                console.log("Environment: " + colors.green(opts.environment.toString()));
                console.log("Context: " + colors.green(opts.context.toString()));
                console.log(LINE);
                console.log(columnify(columns));
                process.exit();
            });

        /**
         * Run the seeder.
         * @usage ./bin/cli seed
         */
        cli.command('seed [options]', "Seed the database with data")
            .option('-s, --seeder [name]', "Run only the given seeder name")
            .option('-d, --dump', "Dump all models before seeding")
            .option('-l, --list', "List the parsed data array in a column view")
            .option('-p, --parseonly', "Run the parser but do not seed the database")
            .action((env,opts) =>
            {
                if (app.env == ENV_PROD) {
                    log.warn("Seeding not allowed in production mode! Exiting.");
                    return process.exit(1);
                }
                // Because this is only running once,
                // we can get away with attaching the CLI options as a service.
                app.register('cliOptions', opts);
                require(app.path('db_path', 'db') + "seeder");
            });

        /**
         * Show all path options.
         * @usage ./bin/cli paths
         */
        cli.command('paths', "Inspect all set paths").action((env,opts) =>
        {
            var columns = Object.keys(path.paths).sort(utils.sortString(1)).map(key => {
                return {
                    key: colors.green(key),
                    path: path.paths[key]
                }
            });

            console.log(columnify(columns));
            process.exit();
        });

        cli.command('events', "List all events and listener count").action((env,opts) => {
            var columns = app.eventNames().map(eventName => {
                return {
                    event: colors.green(eventName),
                    listeners: colors.blue(app.listenerCount(eventName).toString())
                }
            });
            console.log(columnify(columns));
            process.exit();
        })
    }
}

module.exports = CLIProvider;