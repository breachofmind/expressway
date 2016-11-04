"use strict";

var Expressway = require('expressway');
var Express = require('express');

class StaticContent extends Expressway.Middleware
{
    method(request,response,next,path)
    {
        Express.static(path.public().get())(request,response,next);
    }
    /**
     * Load into express, if using globally.
     * @param $app Express
     * @param path PathService
     * @param debug function
     */
    boot($app,path,debug)
    {
        if (path.public) {
            debug(this, 'Using static path: %s', path.public().get());
            super.boot($app);
        }
    }
}

module.exports = StaticContent;