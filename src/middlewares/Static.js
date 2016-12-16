"use strict";

var Expressway = require('expressway');
var Express = require('express');
var _ = require('lodash');
var app = Expressway.app;
var log = app.get('log');
var paths = app.get('paths');

class Static extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides express static content middleware";
    }
    /**
     * Dispatch the middleware function to express.
     * @returns {Session}
     */
    dispatch($module)
    {
        if (! Object.keys($module.staticPaths).length) {
            log.warn(`${$module.name} does not have any static content paths set`);
        }

        let router = Express.Router($module.options || {});

        _.each($module.staticPaths, (dir,uri) =>
        {
            let middleware = Express.static(dir);
            middleware.$route = "Static:"+ dir;
            router.use(uri,middleware);
        });

        return router;
    }
}

module.exports = Static;

