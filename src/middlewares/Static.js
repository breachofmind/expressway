"use strict";

var Middleware = require('../Middleware');
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
        let staticPaths = extension.routes.statics;

        if (! staticPaths.length) {
            log.warn(`${extension.name} does not have any static content paths set`);
            return null;
        }

        let router = express.Router(extension.options || {});

        staticPaths.forEach(object =>
        {
            let {path,uri} = object;
            let middleware = express.static(path);
            middleware.$name = "Static:"+ path;

            router.use(uri,middleware);
            debug("Static path created: %s -> %s", uri, path);
        });

        return router;
    }
}

module.exports = Static;

