"use strict";

var Expressway  = require('expressway');
var program     = require('commander');
var app         = Expressway.instance.app;
var log         = app.get('log');
var cp          = require('child_process');
var path        = require('path');
var ejs         = require('ejs');
var fs          = require('fs');

class CLI
{
    /**
     * Constructor.
     */
    constructor()
    {
        this.program = program.version(app._version);
    }

    /**
     * Return a command.
     * @param name string
     * @param desc string
     * @returns {Command}
     */
    command(name, desc)
    {
        return this.program.command(name).description(desc || "-");
    }

    /**
     * Run and process the cli arguments.
     * @returns void
     */
    run()
    {
        if (! process.argv[2]) process.argv[2] = "--help";
        this.program.parse(process.argv);
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
            throw ("File exists: "+destFile);
        }
        var template = ejs.compile(fs.readFileSync(templateFile, 'utf8').toString());

        fs.writeFileSync(destFile, template(data || {}));

        log.info('Created File: %s', destFile);
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