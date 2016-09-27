"use strict";

var winston = require('winston');
var Provider = require('../provider');
var fs = require('fs');

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
        var logFile = logPath + "server.log";

        if (! fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
            fs.writeFileSync(logFile,"");
        }
        /**
         * Decide which level to report based on the environment.
         * @returns {string}
         */
        function getConsoleLevel()
        {
            switch (app.env) {
                case ENV_TEST: return 'warn';
                case ENV_CLI: return 'info';
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
                    filename: logFile,
                    maxsize: fileMaxSize
                })
            ]
        });

        // Attach to the application.
        app.register('Log', logger);

        app.event.on('application.bootstrap', function(){
            logger.debug('[Application] booting...');
        });

        app.event.on('provider.loaded', function(provider) {
            logger.debug('[Provider] Loaded: %s', provider.name);
        });
    }
}

module.exports = new LoggerProvider();