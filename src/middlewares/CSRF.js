"use strict";

var Expressway = require('expressway');
var csrf = require('csurf');

class CSRF extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides Cross-site Request Forgery (CSRF) protection via csurf";
    }

    dispatch()
    {
        return csrf();
    }
}

module.exports = CSRF;