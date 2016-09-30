"use strict";

var Expressway = require('expressway');

/**
 * Provides a URL helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class URLProvider extends Expressway.Provider
{
    register()
    {
        var config = this.app.config;

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
        this.app.register('url', getUrl);
    }
}

module.exports = URLProvider;