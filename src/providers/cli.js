"use strict";

var program  = require('commander'),
    cp       = require('child_process'),
    path     = require('path'),
    ejs      = require('ejs'),
    fs       = require('fs'),
    _string  = require('lodash/string'),
    expressway = require('expressway');

/**
 * Provides a Command Line interface module.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CLIProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.requires = [
            'LoggerProvider'
        ];

        this.environments = [ENV_CLI];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        var CLI = app.call(this,'getCLIClass',[app,'log']);

        var cli = new CLI(app);

        this.setDefaultActions(app,cli);

        app.register('CLI', cli);
    }

    /**
     * Give the CLI class some default actions.
     * @param app Application
     * @param cli CLI
     */
    setDefaultActions(app,cli)
    {
        // Creates a new model, provider, or controller.
        cli.action('new', function(env,opts)
        {
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = app.path(type+"s_path", type+"s") + opts +".js";

            cli.template(templateFile, destFile , {name:opts, _:_string});

            process.exit(1);
        });
    }

    /**
     * Return the CLI class.
     * @param app Application
     * @param log Winston
     * @returns {CLI}
     */
    getCLIClass(app,log)
    {
        return class CLI
        {
            constructor()
            {
                this.app = app;
                this.cli = program.version(app._version);
            }

            /**
             * Register an action.
             * @param name string
             * @param func
             * @returns CLI
             */
            action(name,func)
            {
                this.cli.command(name).action(func);
                return this;
            }

            /**
             * Set multiple actions.
             * @param object object
             * @returns CLI
             */
            actions(object)
            {
                Object.keys(object).forEach(function(key) {
                    this.action(key, object[key]);
                }.bind(this));
                return this;
            }

            /**
             * Run and process the cli arguments.
             * @returns void
             */
            run()
            {
                this.cli.parse(process.argv);
            };

            /**
             * Create a file from a template.
             * @param templateFile string path
             * @param destFile string path
             * @param data object
             * @returns boolean
             */
            template(templateFile, destFile, data)
            {
                var destDir = path.dirname(destFile);
                if (! fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir);
                }
                if (fs.existsSync(destFile)) {
                    throw new Error("File exists: "+destFile);
                }
                var template = ejs.compile(fs.readFileSync(templateFile, 'utf8').toString());

                fs.writeFileSync(destFile, template(data || {}));

                log.info('[CLI] Created File: %s', destFile);
            };

            /**
             * Execute a cli command and print the response to the console.
             * @param command string
             * @param args array
             * @returns void
             */
            exec(command,args)
            {
                var process = cp.spawn(command,args);
                process.stdout.on('data', function(data) {
                    console.log(data.toString());
                });
            }
        }
    }
}

module.exports = new CLIProvider();