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

    var transports = [];

    transports.push(new winston.transports.Console({
        level: consoleLogLevels[app.context],
        colorize: colorize
    }));

    var logger = new winston.Logger({transports: transports});

    /**
     * Add the server log file after boot.
     * This is the only time we'll know what tmp path we have.
     * @param paths
     */
    function onBoot(paths)
    {
        let dir = paths.build.tmp();
        dir.make();

        transports.push(new winston.transports.File({
            level: fileLogLevels[app.context],
            filename: dir.get('server.log'),
            maxsize: fileMaxSize
        }));

        logger.configure({
            transports: transports
        });

    }

    // Will log events up to the access level into a file.
    if (app.context !== CXT_TEST) {
        app.once('booted', app.callFn(onBoot));
    }

    return logger;
};