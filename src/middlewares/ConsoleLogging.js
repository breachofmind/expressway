"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;

class ConsoleLogging extends Expressway.Middleware
{
    method(request,response,next)
    {
        response.logResponse(app);

        return next();
    }
}

module.exports = ConsoleLogging;

