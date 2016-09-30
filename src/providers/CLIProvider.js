"use strict";

var Expressway = require('expressway');
var CLI = require('./classes/CLI');
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
     */
    register()
    {
        this.cli = this.app.call(CLI, [this.app, 'log']);

        this.setDefaultActions();

        this.app.register('cli', this.cli);
    }

    /**
     * Give the CLI class some default actions.
     */
    setDefaultActions()
    {
        /**
         * Create a new model, controller or provider.
         * @usage ./bin/cli new model ModelName
         */
        this.cli.action('new', function(env,opts)
        {
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = this.app.path(type+"s_path", type+"s") + opts +".js";

            this.cli.template(templateFile, destFile , {name:opts, _:_string});

            process.exit(1);

        }.bind(this));
    }
}

module.exports = CLIProvider;