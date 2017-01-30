"use strict";

var expressway  = require('expressway');
var Provider    = expressway.Provider;
var path        = require('path');
var _string     = require('lodash/string');
var columnify   = require('columnify');
var colors      = require('colors/safe');
var fs          = require('fs');
var https        = require('https');
var _           = require('lodash');

const OBJECT_INDEX = {
    "controller" : 'controllers',
    "middleware" : 'middleware',
    "provider"   : 'providers',
    "service"    : 'services',
    "extension"  : 'root',
    "model"      : 'models',
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

        this.order = 0;

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
            'borrowCommand',
            'startCommand'
        ];

        app.service('cli', app.load('expressway/src/services/CLI'));

        this.commands.forEach(commandName => {
            app.call(this, commandName);
        });
    }

    /**
     * Start the server.
     * @param app
     * @param cli
     */
    startCommand(app,cli)
    {
        cli.command("start", "Start the server").action((env,opts) =>
        {
            app.context = CXT_WEB;
            app.start();
        })
    }

    /**
     * Create a new model, controller or provider.
     * @usage ./bin/cli new [controller|middleware|provider|extension|model] name
     */
    createNewCommand(app,cli,paths)
    {
        cli.command('new [class] <name>', "Create a new provider, middleware, controller or model").action((env,opts) =>
        {
            let fileName = `${opts}.js`;
            let type = env.trim().toLowerCase();
            let tmplFile = path.resolve(__dirname,'../templates', `${type}.template`);

            let destFile = paths.to(OBJECT_INDEX[type], fileName);
            if (! destFile) {
                throw (`template not available: ${type}`);
            }

            cli.template(tmplFile, destFile , {name:opts, _:_string});

            process.exit();
        });
    }

    /**
     * Borrow command.
     * @usage ./bin/cli borrow <object> [options]
     */
    borrowCommand(app,cli,paths,log)
    {
        cli.command('borrow [options]', "Borrow a file from a github location")
            .option('-r, --repo [name]', "Github repo, ie breachofmind/expressway")
            .option('-b, --branch [name]', "Repo branch. Default is master")
            .option('-f, --file [name]', "File to borrow")
            .action((env,opts) =>
            {
                let type = env;
                let base = "https://raw.githubusercontent.com";
                let repo = opts.repo;
                let branch = opts.branch || "master";
                let file = opts.file;
                let destFile = paths.to(OBJECT_INDEX[type], path.basename(file));
                let dest = fs.createWriteStream(destFile);

                let req = https.get(`${base}/${repo}/${branch}/${file}`, function(response) {
                    response.pipe(dest);
                }).on('close', function() {
                    log.info(`created %s: %s`,type,destFile);
                    process.exit();
                });


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

        function display()
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
                        index: cli.Console.Index,
                        flags: cli.Console.Secondary,
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
                    cli.Console.Line,
                    cli.Console.Break
                ]);
            });

            process.exit();
        }

        cli.command('routes', "List all routes and middleware in the application").action((env,opts) =>
        {
            app.boot().then(display);
        });
    }


    /**
     * List all the services in the application.
     * @usage ./bin/cli services
     */
    listServicesCommand(app,cli)
    {
        function display()
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
                    order: cli.Console.Index,
                    type: cli.Console.Secondary,
                    service: cli.Console.Title,
                    value: 'blue',
                    call: 'red',
                },
            });

            cli.output([columns], true);
        }

        cli.command('services', "List all services in the application").action((env,opts) =>
        {
            app.boot().then(display);
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

                function display()
                {
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
                            order: cli.Console.Index,
                            name: cli.Console.Title,
                            loaded: cli.Console.Boolean,
                            contexts(contexts) {
                                return contexts.map(context => { return colors.gray(context) });
                            }
                        }

                    });

                    cli.output([
                        cli.Console.Break,
                        cli.Console.Line,
                        "Environment: " + colors.green(opts.environment.toString()),
                        "Context: " + colors.green(opts.context.toString()),
                        cli.Console.Line,
                        columns
                    ],true);
                }

                app.boot().then(display);
            });
    }


    /**
     * Show all path options.
     * @usage ./bin/cli paths
     */
    listPathsCommand(app,cli,paths)
    {
        function display()
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
                    order: cli.Console.Index,
                    key: cli.Console.Title,
                    exists: cli.Console.Boolean
                }
            });

            cli.output([columns],true);
        }

        cli.command('paths', "List all set paths in the Path service").action((env,opts) =>
        {
            app.boot().then(display);
        });
    }

    /**
     * List event listeners.
     * @usage ./bin/cli events
     */
    listEventsCommand(app,cli)
    {
        function display()
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
                    event: cli.Console.Index,
                    listeners: 'blue'
                }
            });

            cli.output([columns], true);
        }

        cli.command('events', "List all events and listener count").action((env,opts) =>
        {
            app.boot().then(display);
        })
    }

    /**
     * List available controllers.
     * @usage ./bin/cli controllers
     */
    listControllersCommand(app,cli)
    {
        function display()
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
                    order: cli.Console.Index,
                    name: cli.Console.Title,
                }
            });

            cli.output([columns], true);
        }

        cli.command('controllers', "List all controllers").action((env,opts) =>
        {
            app.boot().then(display);
        });
    }

    /**
     * List available middlewares.
     * @usage ./bin/cli middlewares
     */
    listMiddlewaresCommand(app,cli)
    {
        function display()
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
                    order: cli.Console.Index,
                    name: cli.Console.Title,
                    type: 'blue',
                }
            });

            cli.output([columns], true);
        }

        cli.command('middlewares', "List all middlewares").action((env,opts) =>
        {
            app.boot().then(display);
        });
    }
}

module.exports = CLIProvider;