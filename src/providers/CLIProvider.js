"use strict";

var expressway  = require('expressway');
var Provider    = expressway.Provider;
var path        = require('path');
var _string     = require('lodash/string');
var columnify   = require('columnify');
var colors      = require('colors/safe');
var fs          = require('fs');
var _           = require('lodash');

const LINE = Array(30).join("-");
const BREAK = "";
const ITEM_TITLE_COLOR = 'magenta';
const ITEM_ORDER_COLOR = 'blue';

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
class CLIProvider extends Provider
{
    constructor(app)
    {
        super(app);

        this.contexts = CXT_CLI;

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
        ];

        app.service('cli', app.load('expressway/src/CLI'));

        app['cli'] = app.get('cli');
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
     * @usage ./bin/cli new [controller|middleware|provider|extension|model] name
     */
    createNewCommand(cli,paths)
    {
        cli.command('new [class] <name>', "Create a new provider, middleware, controller or model").action((env,opts) =>
        {
            let fileName = `${opts}.js`;
            let types = {
                "controller" : paths.controllers(fileName),
                "middleware" : paths.middleware(fileName),
                "provider"   : paths.providers(fileName),
                "service"   : paths.services(fileName),
                "extension"  : paths.root(fileName),
                "model"      : paths.models(fileName),
            };
            let type = env.trim().toLowerCase();
            let tmplFile = path.resolve(__dirname,'../templates', `${type}.template`);
            let destFile = types[type];
            if (! destFile) {
                throw (`template not available: ${type}`);
            }

            cli.template(tmplFile, destFile , {name:opts, _:_string});

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
            app.extensions.stacks().forEach(extension =>
            {
                var columns = cli.columns(extension.stack, {
                    title: `#${extension.index}: ${extension.name}`,
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
                        index: ITEM_ORDER_COLOR,
                        flags: 'gray',
                        middleware: function(routes)
                        {
                            return routes.map((object,i) =>
                            {
                                if (! object) return "<anonymous>";

                                if (app.services.has(object) && app.service(object) instanceof expressway.Extension) {
                                    return colors.blue(object);
                                }
                                // This is a controller.
                                if (object.indexOf(".") > -1) return colors.cyan(object);
                                // This is middleware.
                                return colors[i < routes.length-1 ? 'gray' : 'white'](object);
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
            var columns = cli.columns(app.services.list(), {
                title: "Services list",
                config: {description: {maxWidth:80}},
                map(item,index) {
                    var service = item.object;
                    let type = typeof service;
                    if (type == 'function') type = item.object.name || type;
                    if (type == 'object' && service.name) type = service.name;
                    return {
                        order: item.index,
                        type: type,
                        service: item.name,
                        value: typeof service == 'string' ? service : "",
                        call: typeof service === 'function' && service.$call ? 'true' : ''
                    }
                },
                sort(object) {
                    return object.name;
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
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

                var columns = cli.columns(app.providers.list(), {
                    title:"Providers list",
                    map(item,index) {
                        let provider = item.object;
                        return {
                            order: provider.order,
                            name: provider.name,
                            loaded: provider.isLoadable(opts.environment, opts.context),
                            envs: provider.environments,
                            contexts: provider.contexts,
                        }
                    },
                    colors: {
                        order: ITEM_ORDER_COLOR,
                        name: ITEM_TITLE_COLOR,
                        loaded: CONSOLE_BOOLEAN,
                        contexts(contexts) {
                            return contexts.map(context => { return colors.gray(context) });
                        }
                    }

                });

                cli.output([
                    BREAK,
                    LINE,
                    "Environment: " + colors.green(opts.environment.toString()),
                    "Context: " + colors.green(opts.context.toString()),
                    LINE,
                    columns
                ],true);
            });
    }

    /**
     * Run the seeder.
     * @usage ./bin/cli seed
     */
    seedCommand(app,cli,paths,log,config)
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

                app.load(config('seeder',paths.db('seeder.js')),[app,opts]);
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
            var columns = cli.columns(paths.list(), {
                title: "Path List",
                map(item,index) {
                    let fullPath = paths.to(item.name);
                    return {
                        order: item.index,
                        key: item.name,
                        exists: paths.exists(item.name),
                        path: fullPath,
                    }
                },
                sort(item) {
                    return item.name;
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
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
    listControllersCommand(app,cli)
    {
        cli.command('controllers', "List all controllers").action((env,opts) =>
        {
            var columns = cli.columns(app.controllers.list(), {
                title: "Controller list",
                map(item, index) {
                    return {
                        order: item.index,
                        name: item.name,
                        description: item.object.description
                    }
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
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
    listMiddlewaresCommand(app,cli)
    {
        cli.command('middlewares', "List all middlewares").action((env,opts) =>
        {
            var columns = cli.columns(app.middleware.list(), {
                title: "Middleware list",
                map(item, index) {
                    return {
                        order: item.index,
                        name: item.name,
                        description: item.object.description || "",
                    }
                },
                sort(item) {
                    return item.name;
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
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
    listModelsCommand(app,cli)
    {
        cli.command('models', "List all models").action((env,opts) =>
        {
            var columns = cli.columns(app.models.list(), {
                title: "Models list",
                map(item, index) {
                    var model = item.object;
                    return {
                        order: item.index,
                        name: model.name,
                        slug: model.slug,
                        title: model.title,
                        expose: model.expose,
                        guards: model.guarded
                    }
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
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