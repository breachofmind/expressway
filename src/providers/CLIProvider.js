"use strict";

var Expressway = require('expressway');

var _string  = require('lodash/string');

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
    }
}

module.exports = CLIProvider;