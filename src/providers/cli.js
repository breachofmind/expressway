"use strict";

var program  = require('commander'),
    cp       = require('child_process'),
    path     = require('path'),
    ejs      = require('ejs'),
    fs       = require('fs'),
    _string  = require('lodash/string'),
    Provider = require('../provider');

function CLI(app)
{
    var cli = program.version(app.version);

    this.app = app;

    /**
     * Register an action.
     * @param name string
     * @param func
     */
    this.action = function(name,func)
    {
        cli.command(name).action(func);
    };

    /**
     * Set multiple actions.
     * @param obj
     */
    this.actions = function(obj)
    {
        for (let name in obj) {
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
     * Create a file from a template.
     * @param templateFile string path
     * @param destFile string path
     * @param data object
     * @returns boolean
     */
    this.template = function(templateFile, destFile, data)
    {
        var destDir = path.dirname(destFile);
        if (! fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        if (fs.existsSync(destFile)) {
            throw ("File exists: "+destFile);
        }
        var template = ejs.compile(fs.readFileSync(templateFile, 'utf8').toString());
        var str = template(data || {});

        fs.writeFileSync(destFile,str);

        app.logger.info('[CLI] Created File: %s', destFile);
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

/**
 * Provides a Command Line interface module.
 * @author Mike Adamczyk <mike@bom.us>
 */
class CLIProvider extends Provider
{
    constructor()
    {
        super('cli');

        this.requires('logger');

        this.inside(ENV_CLI);
    }

    register(app)
    {
        app.cli = new CLI(app);

        app.cli.action('new', function(env,opts){
            var type = env.trim().toLowerCase();
            var templateFile = __dirname + `/../templates/${type}.template`;
            var destFile = app.path(type+"s_path", type+"s") + opts +".js";
            app.cli.template(templateFile, destFile , {name:opts, _:_string});
            process.exit(1);
        });
    }
}

module.exports = new CLIProvider();