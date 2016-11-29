"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var session = require('express-session');
var store = app.get('sessionStore');
var config = app.get('config');

class Session extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides a databased session via express-session";
    }

    dispatch()
    {
        var middleware = session ({
            secret: config('appKey', 'keyboard cat'),
            saveUninitialized: false,
            resave: false,
            store: store
        });

        return function Session(...args) {
            return middleware(...args);
        }
    }
}

module.exports = Session;

