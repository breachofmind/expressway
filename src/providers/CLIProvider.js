"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var _string  = require('lodash/string');
var columnify = require('columnify');
var colors = require('colors');
var fs = require('fs');
var _ = require('lodash');

const LINE = Array(30).join("-");
const BREAK = "";
const ITEM_TITLE_COLOR = 'magenta';

/**
 * Function for coloring a boolean value.
 * @param boolean
 * @returns {string}
 */
const CONSOLE_BOOLEAN = function(boolean) {
    return boolean ? colors.green('yes') : colors.red('no');
};

/**
 * Provides a Command Line interface module.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CLIProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.requires('ControllerProvider');

        this.contexts([CXT_CLI]);

        /**
         * List of command names in the
         * CLI provider class to use.
         * @type {Array<string>}
         */
        this.commands = [
            'createNewCommand',
            'listServicesCommand',
            'listRoutesCommand',
            'listProvidersCommand',
            'listPathsCommand',
            'listEventsCommand',
            'listControllersCommand',
            'listMiddlewaresCommand',
            'listModelsCommand',
            'seedCommand'
        ]

    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        app.singleton('cli', require('../CLI'), "The CLI Class instance");
    }

    /**
     * Give the CLI class some default actions.
     * @param app Application
     */
    boot(app)
    {
        this.commands.forEach(commandName => {
            app.call(this, commandName);
        });
    }

    /**
     * Create a new model, controller or provider.
     * @usage ./bin/cli new model ModelName
     */
    createNewCommand(cli,paths)
    {

        cli.command('new [class] <name>', "Create a new provider, middleware, controller or model").action((env,opts) =>
        {
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = paths.to(type+"s", opts + ".js");

            cli.template(templateFile, destFile , {name:opts, _:_string});

            process.exit();
        });
    }

    /**
     * List all the routes in the application.
     * @usage ./bin/cli routes
     */
    listRoutesCommand(app,cli)
    {
        var METHOD_COLOR = {
            GET:    colors.gray,
            PUT:    colors.magenta,
            POST:   colors.green,
            PATCH:  colors.green,
            DELETE: colors.red,
        };

        cli.command('routes', "List all routes and middleware in the application").action((env,opts) =>
        {
            app.stacks().forEach(application =>
            {
                var columns = cli.columns(application.stack, {
                    title: `#${application.index}: ${application.name}`,
                    map(route,i) {
                        return {
                            index: i,
                            methods: route.methods,
                            flags: route.rx.flags,
                            base: route.rx.path,
                            path: route.path,
                            middleware: route.stack
                        }
                    },
                    colors: {
                        index: ITEM_TITLE_COLOR,
                        flags: 'gray',
                        middleware: function(routes)
                        {
                            return routes.map((name,i) => {
                                // This is a controller.
                                if (name.indexOf(".") > -1) return colors.cyan(name);
                                // This is middleware.
                                return colors[i < routes.length-1 ? 'gray' : 'white'](name);
                            }).join(" -> ");

                        },
                        methods: function(methods)
                        {
                            return methods.map(value => {
                                let methodName = value.toUpperCase();
                                if (METHOD_COLOR[methodName]) {
                                    return METHOD_COLOR[methodName](methodName);
                                }
                                return colors.gray(methodName);
                            })
                        }
                    }
                });

                return cli.output([
                    columns,
                    LINE,
                    BREAK
                ]);
            });

            process.exit();
        });
    }


    /**
     * List all the services in the application.
     * @usage ./bin/cli services
     */
    listServicesCommand(app,cli)
    {
        cli.command('services', "List all services in the application").action((env,opts) =>
        {
            var columns = cli.columns(utils.arrayFromObject(app.services), {
                title: "Services list",
                config: {description: {maxWidth:80}},
                map(object,index) {
                    var service = object.value;
                    let type = typeof service.value;
                    if (type == 'function') type = service.value.name || type;
                    return {
                        type: type,
                        service: service.name,
                        value: typeof service.value == 'string' ? service.value : "",
                        description: service.doc,
                        call: service.call ? 'true' : ''
                    }
                },
                sort(object) {
                    return object.value.name;
                },
                colors: {
                    type: 'gray',
                    service: ITEM_TITLE_COLOR,
                    value: 'blue',
                    call: 'red',
                },
            });

            cli.output([columns], true);
        });
    }

    /**
     * List all the providers in the application.
     * @usage ./bin/cli providers [environment] [context]
     */
    listProvidersCommand(app,cli)
    {

        cli.command('providers [options]', "List all providers in the application loaded with the given environment and context")
            .option('-e, --environment [name]', "Providers loaded for given environment: local|dev|prod")
            .option('-c, --context [name]', "Providers loaded for given context: cli|web|test")
            .action((env,opts) =>
            {
                if (! opts.environment) opts.environment = app.env;
                if (! opts.context) opts.context = CXT_WEB;

                var columns = cli.columns(utils.arrayFromObject(app.providers), {
                    title:"Providers list",
                    map(object,index) {
                        let provider = object.value;
                        return {
                            name: provider.name,
                            module: provider instanceof Expressway.Module,
                            alias: provider.alias || null,
                            loaded: provider.isLoadable(opts.environment, opts.context),
                            envs: provider.environments(),
                            contexts: provider.contexts(),
                            dependencies: provider.requires()
                        }
                    },
                    sort(object) {
                        return object.value.name;
                    },
                    colors: {
                        name: ITEM_TITLE_COLOR,
                        module: CONSOLE_BOOLEAN,
                        loaded: CONSOLE_BOOLEAN,
                        contexts(contexts) {
                            return contexts.map(context => { return colors.gray(context) });
                        }
                    }

                });

                cli.output([
                    LINE,
                    "Environment: " + colors.green(opts.environment.toString()),
                    "Context: " + colors.green(opts.context.toString()),
                    LINE,
                    BREAK,
                    columns
                ],true);
            });
    }

    /**
     * Run the seeder.
     * @usage ./bin/cli seed
     */
    seedCommand(app,cli,paths,log)
    {

        cli.command('seed [options]', "Seed the database with data")
            .option('-s, --seeder [name]', "Run only the given seeder name")
            .option('-d, --dump', "Dump all models before seeding")
            .option('-l, --list', "List the parsed data array in a column view")
            .option('-p, --parseonly', "Run the parser but do not seed the database")
            .action((env,opts) =>
            {
                if (app.env == ENV_PROD) {
                    log.error("Seeding not allowed in production mode! Exiting");
                    return process.exit(1);
                }
                // Because this is only running once,
                // we can get away with attaching the CLI options as a service.
                app.register('cliOptions', opts);

                // require the seeder.js file.
                require(paths.db('seeder'));
            });
    }

    /**
     * Show all path options.
     * @usage ./bin/cli paths
     */
    listPathsCommand(app,cli,paths)
    {
        cli.command('paths', "List all set paths in the Path service").action((env,opts) =>
        {
            var columns = cli.columns(utils.arrayFromObject(paths.all), {
                title: "Path List",
                map(object,index) {
                    let fullPath = paths.to(object.key);
                    return {
                        key: object.key,
                        exists: paths.exists(object.key),
                        path: fullPath,
                    }
                },
                sort(object) {
                    return object.key;
                },
                colors: {
                    key: ITEM_TITLE_COLOR,
                    exists: CONSOLE_BOOLEAN
                }
            });

            cli.output([columns],true);
        });
    }

    /**
     * List event listeners.
     * @usage ./bin/cli events
     */
    listEventsCommand(app,cli)
    {
        cli.command('events', "List all events and listener count").action((env,opts) =>
        {
            var columns = cli.columns(app.eventNames(), {
                title: "Event listeners",
                map(eventName, index) {
                    return {
                        index: index,
                        event: eventName,
                        listeners: app.listenerCount(eventName).toString()
                    }
                },
                colors: {
                    event: ITEM_TITLE_COLOR,
                    listeners: 'blue'
                }
            });

            cli.output([columns], true);
        })
    }

    /**
     * List available controllers.
     * @usage ./bin/cli controllers
     */
    listControllersCommand(app,cli,controller)
    {
        cli.command('controllers', "List all controllers").action((env,opts) =>
        {
            var columns = cli.columns(utils.arrayFromObject(controller), {
                title: "Controller list",
                map(object, index) {
                    return {
                        name: object.key,
                        description: object.value.description
                    }
                },
                sort(object) {
                    return object.value.name;
                },
                colors: {
                    name: ITEM_TITLE_COLOR,
                }
            });

            cli.output([columns], true);
        });
    }

    /**
     * List available middlewares.
     * @usage ./bin/cli middlewares
     */
    listMiddlewaresCommand(app,cli,middleware)
    {
        cli.command('middlewares', "List all middlewares").action((env,opts) =>
        {
            var columns = cli.columns(utils.arrayFromObject(middleware), {
                title: "Middleware list",
                map(object, index) {
                    return {
                        name: object.key,
                        type: object.value.type || "AppModule",
                        description: object.value.description || "",
                    }
                },
                sort(object) {
                    return object.value.name;
                },
                colors: {
                    name: ITEM_TITLE_COLOR,
                    type: 'blue',
                }
            });

            cli.output([columns], true);
        });
    }

    /**
     * List available models.
     * @usage ./bin/cli models
     */
    listModelsCommand(app,cli,modelService)
    {
        cli.command('models', "List all models").action((env,opts) =>
        {
            var columns = cli.columns(utils.arrayFromObject(modelService.models), {
                title: "Models list",
                map(object, index) {
                    var model = object.value;
                    return {
                        name: model.name,
                        slug: model.slug,
                        title: model.title,
                        expose: model.expose,
                        guards: model.guarded
                    }
                },
                sort(object) {
                    return object.value.name;
                },
                colors: {
                    name: ITEM_TITLE_COLOR,
                    title: 'gray',
                    expose: CONSOLE_BOOLEAN
                }
            });

            cli.output([columns], true);
        })
    }
}

module.exports = CLIProvider;