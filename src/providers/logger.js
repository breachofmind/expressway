"use strict";

var winston = require('winston');
var Provider = require('../provider');

var appLevels = {
    levels: {
        error:   0,
        warn:    1,
        access:  2,
        info:    3,
        verbose: 4,
        debug:   5,
        silly:   6
    },
    colors: {
        error:  'red',
        warn:   'yellow',
        access: 'magenta',
        info:   'blue',
    }
};

winston.addColors(appLevels.colors);

Provider.create('loggerProvider', function(app) {

    this.order = -1;

    var config = app.config;
    var logPath = app.constructor.rootPath(config.log_path || "logs") + "/";
    var fileMaxSize = 1000 * 1000 * 10; // 10MB

    var logger = new winston.Logger({
        levels: appLevels.levels,
        transports: [
            new winston.transports.Console({
                level: (config.debug ? 'debug' : 'info'),
                colorize:true
            }),
            new winston.transports.File({
                level: 'access',
                filename: logPath + "server.log",
                maxsize: fileMaxSize
            })
        ]
    });

    // Attach to the application.
    app.logger = logger;
});