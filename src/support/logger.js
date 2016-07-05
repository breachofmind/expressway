var winston = require('winston');

var appLevels = {
    levels: {
        error:   0,
        warn:    1,
        info:    2,
        access:  3,
        verbose: 4,
        debug:   5,
        silly:   6
    },
    colors: {
        error:  'red',
        warn:   'yellow',
        info:   'blue',
    }
};

winston.addColors(appLevels.colors);

module.exports = function(app,config)
{
    var logPath = app.constructor.rootPath(config.log_path || "tmp") + "/";

    return new winston.Logger({
        levels: appLevels.levels,
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                name:       'access-file',
                level:      'access',
                filename:   logPath + "server.log",
                maxsize:    1000 * 1000 * 10 // 10MB
            }),
        ]
    });
};