"use strict";

var Expressway = require('expressway');
var csrf = require('csurf');

class CSRFMiddleware extends Expressway.Middleware
{
    dispatch()
    {
        return csrf();
    }
}

module.exports = CSRFMiddleware;