"use strict";

var Expressway = require('expressway');
var csrf = require('csurf');

class CSRF extends Expressway.Middleware
{
    dispatch()
    {
        return csrf();
    }
}

module.exports = CSRF;