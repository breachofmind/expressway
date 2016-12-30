"use strict";

var colors = require('colors/safe');

/**
 * A colorful debugger.
 * @param app
 */
module.exports = function(app)
{
    return function(message,...args)
    {
        if (app.config.debug === false || app.context !== CXT_WEB) return;
        args.forEach(arg => {
            if (isNaN(arg)) arg = colors.green(arg);
            else arg = colors.blue(arg);
            message = message.replace("%s", arg);
        });
        let parts = message.split(" ");
        parts[0] = colors.gray(parts[0]);

        console.log(colors.blue("debug")+": "+ parts.join(" "));
    }
};