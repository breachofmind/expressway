"use strict";

var program  = require('commander');
var cp       = require('child_process');
var path     = require('path');
var ejs      = require('ejs');
var fs       = require('fs');

class CLI
{
    /**
     * Constructor.
     * @param app Application
     * @param log Winston
     */
    constructor(app,log)
    {
        this.app = app;
        this.log = log;

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

module.exports = CLI;