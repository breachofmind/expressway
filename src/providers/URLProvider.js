"use strict";

var Expressway = require('expressway');

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

        var baseurl = config.proxy ? config.proxy : config.url + ":" +config.port;

        debug(this,"Using: %s", baseurl);
        /**
         * Return a url to the given path.
         * @return string
         */
        function getUrl(uri)
        {
            if (!uri) uri = "";
            return `${baseurl}/${uri}`;
        }

        // Attach to the application.
        app.register('url', getUrl);
    }
}

module.exports = URLProvider;