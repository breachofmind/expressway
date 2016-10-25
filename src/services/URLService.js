"use strict";

var _ = require('lodash/string');
var URL = require('url');
var path = require('path');
var fs = require('fs');

/**
 * Service for parsing the base URL and returning a url relative to the base url.
 * @param app Application
 * @returns {applicationUrl}
 */
function URLService(app)
{
    var config = app.config;

    // Set up a service to return the application URL.
    var baseurl = _.trimEnd(config.proxy ? config.proxy : config.url + ":" +config.port, "/");

    /**
     * Return a url to the given path.
     * @return string
     */
    function applicationUrl (uri)
    {
        if (!uri) uri = "";
        uri = _.trim(uri,"/");
        return `${baseurl}/${uri}`;
    }

    var parsed = URL.parse(baseurl);
    Object.keys(parsed).map(key => {
        applicationUrl[key] = parsed[key];
    });

    applicationUrl.prototype.toString = function() {
        return applicationUrl();
    };

    return applicationUrl;
}

module.exports = URLService;