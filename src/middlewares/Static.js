"use strict";

var Middleware = require('expressway').Middleware;
var express    = require('express');
var _          = require('lodash');

class Static extends Middleware
{
    get description() {
        return "Provides express static content middleware";
    }
    /**
     * Dispatch the middleware function to express.
     * @param extension Extension
     * @param log Winston
     * @param debug Function
     * @returns {Session}
     */
    dispatch(extension,log, debug)
    {
        if (! Object.keys(extension.staticPaths).length) {
            log.warn(`${extension.name} does not have any static content paths set`);
        }

        let router = express.Router(extension.options || {});

        _.each(extension.staticPaths, (dir,uri) =>
        {
            let middleware = express.static(dir);
            middleware.$name = "Static:"+ dir;
            router.use(uri,middleware);
            debug("Static path created: %s -> %s", uri,dir);
        });

        return router;
    }
}

module.exports = Static;

