"use strict";

var expressway = require('expressway');
var colors = require('colors/safe');

class ConsoleLogging extends expressway.Middleware
{
    get description() {
        return "Logs the incoming request to the console";
    }

    constructor(app)
    {
        super(app);

        /**
         * Print colors in the console?
         * @type {boolean}
         */
        this.pretty = false;
    }

    dispatch(extension,log)
    {
        let self = this;

        return function ConsoleLogging(request,response,next)
        {
            response.on('finish', () =>
            {
                let info = response.info();

                info.extension = extension.name;

                var type = 'info';
                if (info.status >= 400) type = 'warn';
                if (info.status >= 500) type = 'error';

                // Not Modified, who cares
                if (info.status == 304) return;

                if (self.pretty) {
                    var methodColor = "gray";
                    if (info.method == "POST") methodColor = "yellow";
                    if (info.method == "PUT") methodColor = "magenta";
                    if (info.method == "DELETE") methodColor = "red";
                    log[type] ("%s %s %s '%s' %s %s %s",
                        info.ip,
                        colors[methodColor] (info.method),
                        colors.blue(info.status),
                        info.phrase,
                        colors.green(info.route) ,
                        info.url,
                        info.user
                    );

                } else {
                    log[type] (info.method, info);
                }
            });

            return next();
        }
    }
}

module.exports = ConsoleLogging;

