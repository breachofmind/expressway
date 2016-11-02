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
            let dir = path.public().get();
            debug(this, 'Using static path: %s', dir);
            $app.use(Express.static(dir));
        }
    }
}

module.exports = StaticContentMiddleware;