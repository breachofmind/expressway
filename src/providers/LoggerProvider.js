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

        this.requires = ['CoreProvider'];
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
                debug:  'cyan',
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
     * @param path PathService
     */
    register(app,event,path)
    {
        winston.addColors(this.config.colors);

        var logFile = path.logs(this.logFileName);

        if (! fs.existsSync(logFile)) fs.writeFileSync(logFile, "");

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

        app.register('log', logger, "The main Winston logger instance");
        app.register('debug', debug, "Console logging function for debugging");

        function debug(className, message, ...args)
        {
            if (app.config.debug !== true) return;
            if (typeof className == 'object') className = className.constructor.name;
            args = args.map(function(arg) { return colors.green(arg) });
            var classColor = "magenta";
            if (className == "Application") classColor = "yellow";
            logger.debug(`[${colors[classColor](className)}] ${message}`, ...args);
        }

        event.on('application.bootstrap', (app) => {
            debug(app, 'booting...');
        });

        event.on('provider.loaded', (provider) => {
            debug('Provider', 'Loaded: %s', colors.gray(provider.name));
        });

        event.on('providers.registered', (app) => {
            debug(app, 'Providers Created: %s, Registered: %s', Object.keys(app.providers).length, app._order.length);
            debug(app, 'Provider Order... \n%s', app._order.map((name,i) => { return `#${i} - ${name}`; }).join("\n"));
        })
    }

    /**
     * Decide which level to report to the console
     * based on the environment.
     * @returns {string}
     */
    getConsoleLevel()
    {
        switch (this.app.context) {
            case CXT_TEST: return 'warn';
            case CXT_CLI: return 'info';
            default: return this.app.conf('debug') == true ? 'debug' : 'info';
        }
    }
}

module.exports = LoggerProvider;