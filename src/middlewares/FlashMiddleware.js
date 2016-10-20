"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var flash = require('connect-flash');

class FlashMiddleware extends Expressway.Middleware
{
    /**
     * Load into express, if using globally.
     * @param express
     */
    load(express)
    {
        express.use( flash() );
    }
}

module.exports = FlashMiddleware;

