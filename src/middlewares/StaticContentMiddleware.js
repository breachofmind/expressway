"use strict";

var Expressway = require('expressway');
var Express = require('express');

class StaticContentMiddleware extends Expressway.Middleware
{
    /**
     * Load into express, if using globally.
     * @param $app Express
     * @param path PathService
     * @param debug function
     */
    boot($app,path,debug)
    {
        if (path.public) {
            debug(this, 'Using static path: %s', path.public());
            $app.use(Express.static(path.public()));
        }
    }
}

module.exports = StaticContentMiddleware;