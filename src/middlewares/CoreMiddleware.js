"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;

class CoreMiddleware extends Expressway.Middleware
{
    method(request,response,next)
    {
        response.logResponse(app);

        return next();
    }
}

module.exports = CoreMiddleware;

