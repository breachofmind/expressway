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
        access: 'magenta',
        info:   'blue',
    }
};

winston.addColors(appLevels.colors);

module.exports = function(app,config)
{
    var logPath = app.constructor.rootPath(config.log_path || "logs") + "/";
    var fileMaxSize = 1000 * 1000 * 10; // 10MB

    var transports = [];
    ['warn','error','access'].forEach(function(level) {
        transports.push(new winston.transports.Console({
            name: 'console-'+level,
            level: level,
            colorize:true
        }));
        transports.push(new winston.transports.File({
            name: 'server-'+level,
            level: level,
            filename: logPath + "server.log",
            maxsize: fileMaxSize
        }));
    });

    transports.push(new winston.transports.File({
        name: 'access-file',
        level: 'access',
        filename: logPath + "access.log",
        maxsize: fileMaxSize
    }));

    return new winston.Logger({
        levels: appLevels.levels,
        colors: appLevels.colors,
        transports: transports
    });
};