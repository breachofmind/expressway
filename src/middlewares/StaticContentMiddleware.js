"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var Express = require('express');

class StaticContentMiddleware extends Expressway.Middleware
{
    /**
     * Load into express, if using globally.
     * @param express
     * @param path PathService
     * @param debug function
     */
    boot(express,path,debug)
    {
        if (path.public) {
            debug(this, 'Using static path: %s', path.public());
            express.use(Express.static(path.public()));
        }
    }
}

module.exports = StaticContentMiddleware;

