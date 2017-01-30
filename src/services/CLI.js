"use strict";

var program     = require('commander');
var columnify   = require('columnify');
var colors      = require('colors/safe');
var cp          = require('child_process');
var path        = require('path');
var ejs         = require('ejs');
var fs          = require('fs');
var _           = require('lodash');

module.exports = function(app,log)
{
    class CLI
    {
        /**
         * Constructor.
         */
        constructor()
        {
            this.program = program.version(app.version);
        }

        /**
         * Return the constructor name.
         * @returns {String}
         */
        get name() {
            return this.constructor.name;
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
        run(args)
        {
            if (! arguments.length) args = process.argv;
            if (! args[2]) args[2] = "--help";

            return this.program.parse(args);
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
            let destDir = path.dirname(destFile);
            if (! fs.existsSync(destDir)) {
                fs.mkdirSync(destDir);
            }
            if (fs.existsSync(destFile)) {
                throw ("File exists: "+destFile);
            }
            let template = ejs.compile(fs.readFileSync(templateFile, 'utf8').toString());

            fs.writeFileSync(destFile, template(data || {}));

            log.info('Created File: %s', destFile);
        };

        /**
         * Create formatted columns of an array.
         * @param array array|object
         * @param opts object
         * @returns {string}
         */
        columns(array,opts)
        {
            var mapper = opts.map;
            var colorizer = opts.colors || {};
            var colorKeys = Object.keys(colorizer);
            var title = opts.title ? colors.blue(opts.title)+"\n" : "";
            if (opts.sort) array = _.sortBy(array, opts.sort);

            let columns = _.map(array, (value,key) =>
            {
                let object = mapper(value,key);
                colorKeys.forEach(property =>
                {
                    if (! object.hasOwnProperty(property)) return;
                    let colorType = colorizer[property];

                    if (typeof colorType == 'string') {
                        // Just color the value by the string color name.
                        return object[property] = colors[colorType](object[property]);
                    } else if (typeof colorType == 'function') {
                        // Wrap the value in a callback.
                        return object[property] = colorType(object[property],object);
                    }
                });
                return object;
            });
            if (! columns.length) {
                return title + "No Objects.";
            }

            return "\n"+title + columnify(columns, {config:opts.config});
        }

        /**
         * Log an array of strings.
         * @param logToConsole array<string>
         * @param exit boolean
         */
        output(logToConsole=[], exit=false)
        {
            logToConsole.forEach(string=> { console.log(string) });
            if (exit) process.exit();
        }

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

    // Default console colors.
    CLI.prototype.Console = {
        Break: "",
        Line: Array(30).join("-"),
        Index: 'blue',
        Secondary: 'gray',
        Title: 'magenta',
        Boolean(boolean) {
            return boolean ? colors.green('yes') : colors.red('no');
        }
    };

    return new CLI;
};