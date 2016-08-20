"use strict";

var winston = require('winston');
var Provider = require('../provider');

/**
 * Provides the winston logger.
 * @author Mike Adamczyk <mike@bom.us>
 */
class LoggerProvider extends Provider
{
    constructor()
    {
        super('logger');

        this.order = -1;
    }

    register(app)
    {
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

        var fileMaxSize = 1000 * 1000 * 10; // 10MB
        var logPath = app.rootPath(app.conf('logs_path', 'logs')) + "/";

        function getConsoleLevel()
        {
            switch (app.env) {
                case ENV_TEST: return 'error';
                case ENV_CLI: return 'warn';
                default: return app.conf('debug') == true ? 'debug' : 'info';
            }
        }

        var logger = new winston.Logger({
            levels: appLevels.levels,
            transports: [
                new winston.transports.Console({
                    level: getConsoleLevel(),
                    colorize:true
                }),
                new winston.transports.File({
                    level: 'access',
                    filename: logPath + "server.log",
                    maxsize: fileMaxSize
                })
            ]
        });

        if (typeof app.config.logger == 'function') app.config.logger.call(logger, winston);

        // Attach to the application.
        app.logger = logger;

        app.event.on('provider.loaded', function(provider) {
            app.logger.debug('[Provider] Loaded: %s', provider.name);
        });
    }
}

module.exports = new LoggerProvider();