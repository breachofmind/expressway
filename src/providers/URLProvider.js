"use strict";

var Expressway = require('expressway');
var _ = require('lodash/string');
var URL = require('url');

/**
 * Provides a URL helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class URLProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);
        this.requires = ['LoggerProvider'];
    }
    /**
     * Register with the application.
     * @param app Application
     * @param debug function
     */
    register(app,debug)
    {
        var config = app.config;

        var baseurl = _.trimEnd(config.proxy ? config.proxy : config.url + ":" +config.port, "/");

        debug(this,"Using: %s", baseurl);
        /**
         * Return a url to the given path.
         * @return string
         */
        function getUrl(uri)
        {
            if (!uri) uri = "";
            uri = _.trim(uri,"/");
            return `${baseurl}/${uri}`;
        }

        // Attach to the application.
        app.register('url', getUrl, "Function for returning the url/proxy url");
        app.register('domain', URL.parse(baseurl).hostname, "The server or proxy domain name");
    }
}

module.exports = URLProvider;