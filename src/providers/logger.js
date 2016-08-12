"use strict";

var winston = require('winston');

/**
 * Provides the winston logger.
 * @author Mike Adamczyk <mike@bom.us>
 * @param Provider
 */
module.exports = function(Provider)
{
    Provider.create('loggerProvider', function() {

        this.order = -1;

        return function(app)
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
            var config = app.config;
            var logPath = app.rootPath(config.log_path || "logs") + "/";

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

            if (typeof app.config.logger == 'function') app.config.logger.call(logger, winston);

            // Attach to the application.
            app.logger = logger;

            app.event.on('provider.loaded', function(provider) {
                app.logger.debug('[Provider] Loaded: %s', provider.name);
            });
        }
    });
};
