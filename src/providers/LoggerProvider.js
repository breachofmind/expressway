"use strict";

var winston = require('winston');
var Expressway = require('expressway');
var fs = require('fs');

/**
 * Provides the winston logger.
 * @author Mike Adamczyk <mike@bom.us>
 */
class LoggerProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.order = -1;
        this.inject = ['event'];

        this.config = {
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
                info:   'blue'
            }
        };

        this.fileMaxSize = 1000 * 1000 * 10; // 10MB
        this.logFileName = "server.log";
        this.colorize = true;
    }

    /**
     * Register the provider with the application.
     * @param event EventEmitter
     */
    register(event)
    {
        winston.addColors(this.config.colors);

        var logPath = this.app.path('logs_path', 'logs');
        var logFile = logPath + this.logFileName;

        // Create the log path, if it doesn't exist.
        if (! fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
            fs.writeFileSync(logFile,"");
        }

        var logger = new winston.Logger({
            levels: this.config.levels,
            transports: [
                new winston.transports.Console({
                    level: this.getConsoleLevel(),
                    colorize: this.colorize
                }),

                // Will log events up to the access level into a file.
                new winston.transports.File({
                    level: 'access',
                    filename: logFile,
                    maxsize: this.fileMaxSize
                })
            ]
        });

        this.app.register('log', logger);

        event.on('application.bootstrap', function(){
            logger.debug('[Application] booting...');
        });

        event.on('provider.loaded', function(provider) {
            logger.debug('[Provider] Loaded: %s', provider.name);
        });
    }

    /**
     * Decide which level to report to the console
     * based on the environment.
     * @param app Application
     * @returns {string}
     */
    getConsoleLevel()
    {
        switch (this.app.env) {
            case ENV_TEST: return 'warn';
            case ENV_CLI: return 'info';
            default: return this.app.conf('debug') == true ? 'debug' : 'info';
        }
    }
}

module.exports = LoggerProvider;