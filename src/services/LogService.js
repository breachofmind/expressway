"use strict";

var winston = require('winston');
var path    = require('path');
var fs      = require('fs');

// error:   0
// warn:    1
// info:    2
// verbose: 3
// debug:   4
// silly:   5

/**
 * The default log service.
 * @param app Application
 * @returns {*}
 */
module.exports = function(app)
{
    var fileMaxSize = 1000 * 1000 * 10; // 10MB
    var logFileName = path.join(app.rootPath, "tmp") + "/server.log";
    var colorize    = true;

    var consoleLogLevels = {
        [CXT_TEST] : 'warn',
        [CXT_CLI] : 'info',
        [CXT_WEB]  : app.config.debug ? 'debug' : 'info'
    };

    var fileLogLevels = {
        [CXT_TEST] : 'warn',
        [CXT_CLI] : 'warn',
        [CXT_WEB]  : 'warn'
    };

    // Create the file if it doesn't exist.
    // Disregard if working in a test environment.
    if (! fs.existsSync(logFileName) && app.context !== CXT_TEST) {
        fs.writeFileSync(logFileName,"");
    }
    var transports = [];

    transports.push(new winston.transports.Console({
        level: consoleLogLevels[app.context],
        colorize: colorize
    }));

    // Will log events up to the access level into a file.
    if (app.context !== CXT_TEST) {
        transports.push(new winston.transports.File({
            level: fileLogLevels[app.context],
            filename: logFileName,
            maxsize: fileMaxSize
        }));
    }

    return new winston.Logger({transports: transports});
};