"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var flash = require('connect-flash');

class FlashMiddleware extends Expressway.Middleware
{
    dispatch()
    {
        return flash();
    }
}

module.exports = FlashMiddleware;

