"use strict";

var Expressway = require('expressway');
var app = Expressway.app;
var log = app.get('log');
var colors = require('colors/safe');

class ConsoleLogging extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Logs the incoming request to the console";
    }

    method(request,response,next)
    {
        response.on('finish', () =>
        {
            var type = 'info';
            if (response.statusCode >= 400) type = 'warn';
            if (response.statusCode >= 500) type = 'error';

            // Not Modified, who cares
            if (response.statusCode == 304) return;

            var methodColor = "gray";
            if (response.req.method == "POST") methodColor = "yellow";
            if (response.req.method == "PUT") methodColor = "magenta";
            if (response.req.method == "DELETE") methodColor = "red";

            log[type] ("%s %s %s '%s' %s %s %s",
                response.req.ip,
                colors[methodColor] (response.req.method),
                colors.blue(response.statusCode),
                response.phrase(),
                colors.green(response.$route) ,
                response.req.url,
                response.req.user ? colors.gray(response.req.user.id) : ""
            );
        });

        return next();
    }
}

module.exports = ConsoleLogging;

