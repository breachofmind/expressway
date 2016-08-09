"use strict";

var program = require('commander');
var cp = require('child_process');
var ejs = require('ejs');
var fs = require('fs');

module.exports = function CLIProvider(app)
{
    var actions = {};
    var cli = program.version(app.version);


    function createTemplate(type)
    {
        return function(name) {
            if (! name || name=="") {
                throw new Error("Specify a name for the "+type);
            }
            var template = ejs.compile(fs.readFileSync(__dirname + `/templates/${type}.template`).toString());
            var str = template({name:name});
            fs.writeFileSync(app.rootPath(`${type}s/${name}.js`),str);
        }
    }

    return {
        logger: app.logger,

        controller: createTemplate('controller'),

        model: createTemplate('model'),

        /**
         * Register an action.
         * @param name string
         * @param func
         */
        action: function(name,func)
        {
            cli.command(name).action(func);
            actions[name] = func;
        },

        /**
         * Set multiple actions.
         * @param obj
         */
        actions: function(obj)
        {
            for (let name in obj)
            {
                this.action(name, obj[name]);
            }
        },

        /**
         * Run and process the cli arguments.
         * @returns void
         */
        run: function()
        {
            cli.parse(process.argv);
        },

        /**
         * Execute a cli command and print the response to the console.
         * @param command string
         * @param args array
         * @returns void
         */
        exec: function(command,args)
        {
            var process = cp.spawn(command,args);
            process.stdout.on('data', function(data) {
                console.log(data.toString());
            });
        }
    };
};