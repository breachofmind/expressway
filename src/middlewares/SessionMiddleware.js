"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var session = require('express-session');

class SessionMiddleware extends Expressway.Middleware
{
    dispatch(request,response,next)
    {
        if (request.query.cc) {
            request.locale = request.query.cc.toLowerCase();
        }
        next();
    }

    /**
     * Load into express, if using globally.
     * @param express
     * @param driverProvider DriverProvider
     */
    load(express, driverProvider)
    {
        express.use(session ({
            secret: app.conf('appKey', 'keyboard cat'),
            saveUninitialized: false,
            resave: false,
            store: app.call(driverProvider,'getSessionStore')
        }));
    }
}

module.exports = SessionMiddleware;

