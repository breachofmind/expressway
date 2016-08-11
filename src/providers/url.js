"use strict";

var Provider = require('../provider');

Provider.create('urlProvider', function() {

    return function(app)
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
});