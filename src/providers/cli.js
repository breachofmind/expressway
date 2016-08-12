"use strict";

var program = require('commander'),
    cp      = require('child_process'),
    ejs     = require('ejs'),
    fs      = require('fs');

/**
 * Provides a Command Line interface module.
 * @author Mike Adamczyk <mike@bom.us>
 * @param Provider
 */
module.exports = function(Provider)
{
    Provider.create('cliProvider', function(){

        this.requires('loggerProvider');
        this.runIn(ENV_CLI);

        return function(app)
        {
            var actions = {};

            var cli = program.version(app.version);

            /**
             * Standard function for creating app classes from templates.
             * @param type string controller|model|provider
             * @returns {Function}
             */
            function createTemplate(type)
            {
                return function(name) {
                    var destDir = app.rootPath(`${type}s`);
                    if (!fs.existsSync(destDir)){
                        fs.mkdirSync(destDir);
                    }
                    var destFile = `${destDir}/${name}.js`;
                    if (! name || name=="") {
                        throw new Error("Specify a name for the "+type);
                    }
                    if (fs.existsSync(destFile)) {
                        throw ("File exists: "+destFile);
                    }
                    var template = ejs.compile(fs.readFileSync(__dirname + `/../templates/${type}.template`).toString());
                    var str = template({name:name});
                    fs.writeFileSync(destFile,str);
                }
            }

            function CLI ()
            {
                this.logger = app.logger;

                // Create a controller from the template.
                this.controller = createTemplate('controller');

                // Create a model from the template.
                this.model = createTemplate('model');

                // Create a provider from the template.
                this.provider = createTemplate('provider');

                /**
                 * Register an action.
                 * @param name string
                 * @param func
                 */
                this.action = function(name,func)
                {
                    cli.command(name).action(func);
                    actions[name] = func;
                };

                /**
                 * Set multiple actions.
                 * @param obj
                 */
                this.actions = function(obj)
                {
                    for (let name in obj)
                    {
                        this.action(name, obj[name]);
                    }
                };

                /**
                 * Run and process the cli arguments.
                 * @returns void
                 */
                this.run = function()
                {
                    cli.parse(process.argv);
                };

                /**
                 * Execute a cli command and print the response to the console.
                 * @param command string
                 * @param args array
                 * @returns void
                 */
                this.exec = function(command,args)
                {
                    var process = cp.spawn(command,args);
                    process.stdout.on('data', function(data) {
                        console.log(data.toString());
                    });
                }
            }

            app.CLI = new CLI();

            app.CLI.action('controller', function(env) {
                app.CLI.controller(env);
                process.exit();
            });


            app.CLI.action('model', function(env) {
                app.CLI.model(env);
                process.exit();
            });


            app.CLI.action('provider', function(env) {
                app.CLI.provider(env);
                process.exit();
            });
        }

    });
};
