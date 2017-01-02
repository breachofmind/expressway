"use strict";

var colors = require('colors/safe');

/**
 * A colorful debugger.
 * @param app
 * @param log Winston
 */
module.exports = function(app,log)
{
    return function(message,...args)
    {
        args.forEach((arg,i) => {
            if (isNaN(arg)) args[i] = colors.green(arg);
            else args[i] = colors.blue(arg);
        });
        let parts = message.split(" ");
        parts[0] = colors.gray(parts[0]);

        log.debug(parts.join(" "), ...args);
    }
};