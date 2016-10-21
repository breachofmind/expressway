"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var session = require('express-session');
var driverProvider = app.get('driverProvider');

class SessionMiddleware extends Expressway.Middleware
{
    dispatch()
    {
        return session ({
            secret: app.conf('appKey', 'keyboard cat'),
            saveUninitialized: false,
            resave: false,
            store: app.call(driverProvider,'getSessionStore')
        })
    }
}

module.exports = SessionMiddleware;

