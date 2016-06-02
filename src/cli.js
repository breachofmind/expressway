"use strict";

var program = require('commander');
var cp = require('child_process');

class CLI
{
    /**
     * Named constructor.
     * @returns {CLI}
     */
    static init()
    {
        return new CLI();
    }

    /**
     * Constructor.
     */
    constructor()
    {
        this._actions = {};
        this.cli = program.version('1.0.0');
    }

    /**
     * Register an action.
     * @param name string
     * @param func
     */
    action(name, func)
    {
        this.cli.command(name).action(func);
        this._actions[name] = func;
    }

    /**
     * Set multiple actions.
     * @param obj
     */
    actions(obj)
    {
        for (let name in obj)
        {
            this.action(name,obj[name]);
        }
    }

    /**
     * Run and process the cli arguments.
     * @returns void
     */
    run()
    {
        this.cli.parse(process.argv);
    }

    /**
     * Log a message using the application logger.
     * @param message string
     */
    log(message)
    {
        console.log(message);
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

module.exports = CLI;