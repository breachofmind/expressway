"use strict";

var expressway = require('expressway');

/**
 * Provides a URL helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class URLProvider extends expressway.Provider
{
    register(app)
    {
        var config = app.config;

        var baseurl = config.proxy ? config.proxy : config.url + ":" +config.port;

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
        app.url = getUrl;
    }
}

module.exports = new URLProvider();