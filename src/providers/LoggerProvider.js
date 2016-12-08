"use strict";

var winston = require('winston');
var Expressway = require('expressway');
var fs = require('fs');
var _ = require('lodash');
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

        this.order(0);
        this.requires('CoreProvider');

        this.fileMaxSize = 1000 * 1000 * 10; // 10MB
        this.logFileName = "server.log";
        this.colorize    = true;

        // error:   0
        // warn:    1
        // info:    2
        // verbose: 3
        // debug:   4
        // silly:   5

        this.consoleLogLevels = {
            [CXT_TEST] : 'warn',
            [CXT_CLI] : 'info',
            [CXT_WEB]  : app.config.debug ? 'debug' : 'info'
        };

        this.fileLogLevels = {
            [CXT_TEST] : 'warn',
            [CXT_CLI] : 'warn',
            [CXT_WEB]  : 'warn'
        }
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param path PathService
     */
    register(app,path)
    {
        var logFile = path.logs(this.logFileName);

        if (! logFile.exists) fs.writeFileSync(logFile.get(), "");

        this.logger = new winston.Logger({
            transports: [
                new winston.transports.Console({
                    level: this.consoleLogLevels[app.context],
                    colorize: this.colorize
                }),

                // Will log events up to the access level into a file.
                new winston.transports.File({
                    level: this.fileLogLevels[app.context],
                    filename: logFile.get(),
                    maxsize: this.fileMaxSize
                })
            ]
        });

        app.register('log', this.logger, "The main Winston logger instance");

        app.register('debug', this.debug.bind(this), "Console logging function for debugging");

        // Show debugging messages when providers load.
        app.on('provider.loaded', provider =>
        {
            this.debug(provider, 'Loaded');
        });

        // Show debugging messages when all providers are registered.
        app.once('providers.registered', () =>
        {
            this.debug(app, 'Providers Created: %s, Registered: %s', Object.keys(app.providers).length, app._order.length);
            this.debug(app, 'Booting...');
        });

        app.once('application.booted', () =>
        {
            this.debug(app, 'Booted!');
        });
    }

    /**
     * Debugging helper function.
     * fired only when config.debug = true.
     * @param className string|object
     * @param message string
     * @param args string
     */
    debug(className,message,...args)
    {
        let maxLen = 20;
        if (this.app.config.debug !== true) {
            return;
        }
        if (typeof className == 'object') {
            className = className.constructor.name;
        }
        args = args.map(function(arg) {
            return colors.green(arg)
        });

        this.logger.debug(`${colors['magenta'](_.padStart(className,maxLen))} ${message}`, ...args);
    }
}

module.exports = LoggerProvider;