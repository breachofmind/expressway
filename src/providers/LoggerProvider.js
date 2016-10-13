"use strict";

var winston = require('winston');
var Expressway = require('expressway');
var fs = require('fs');
var colors = require('colors/safe');

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
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        winston.addColors(this.config.colors);

        var logPath = app.path('logs_path', 'logs') + '/';
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

        app.register('log', logger);
        app.register('debug', debug);

        function debug(className, message, ...args) {
            if (typeof className == 'object') className = className.constructor.name;
            args = args.map(function(arg) { return colors.green(arg) });
            logger.debug(`[${colors.magenta(className)}] ${message}`, ...args);
        }

        event.on('application.bootstrap', function(app){
            debug(app, 'booting...');
        });

        event.on('provider.loaded', function(provider) {
            debug('Provider', 'Loaded: %s', colors.gray(provider.name));
        });

        event.on('providers.registered', function(app) {
            debug(app, 'Providers registered: %s', Object.keys(app.providers).length);
        })
    }

    /**
     * Decide which level to report to the console
     * based on the environment.
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