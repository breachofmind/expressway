"use strict";

var Expressway = require('expressway');
var Express = require('express');
var app = Expressway.app;
var path = app.get('path');

class StaticContent extends Expressway.Middleware
{
    constructor()
    {
        super();

        this.paths = {
            "/" : path.public(),
        }
    }

    /**
     * Load into express, if using globally.
     * @param $app Express
     * @param debug function
     */
    boot($app,debug)
    {
        Object.keys(this.paths).forEach((uri,i) => {
            let dir = this.paths[uri].toString();
            let name = this.name + i;
            var route = function middleware(request,response,next) {
                response.$route = name;
                Express.static(dir)(request,response,next);
            };
            route.$route = name;
            $app.use(uri, route);
            debug(this, 'Using static path: %s -> %s', dir,uri);
        });
    }
}

module.exports = StaticContent;