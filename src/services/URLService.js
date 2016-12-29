"use strict";

var _ = require('lodash');
var URL = require('url');
var path = require('path');
var fs = require('fs');

/**
 * Service for parsing the base URL and returning a url relative to the base url.
 * @param app Application
 * @param config Function
 * @returns {URLService}
 */
module.exports = function(app,config)
{
    var base = _.trimEnd(config('proxy', `${config('url')}:${config('port')}`), "/");

    return new class URLService
    {
        get name()
        {
            return this.constructor.name;
        }

        /**
         * Get the base url.
         * @returns {String}
         */
        get base()
        {
            return base;
        }

        /**
         * Get the parsed base url.
         * @returns {Object}
         */
        get parsed()
        {
            return URL.parse(this.base);
        }

        /**
         * Get the domain name.
         * @returns {String}
         */
        get domain()
        {
            return this.parsed.hostname;
        }

        /**
         * Get the url.
         * @param uri {String|Array}
         * @returns {string}
         */
        get(uri="") {
            if (Array.isArray(uri)) {
                uri = _.compact(uri).join("/");
            }
            uri = _.trim(uri, "/");
            return `${this.base}/${uri}`;
        }

        /**
         * Get the value of this object.
         * @returns {String}
         */
        toValue() {
            return "[Object URLService]";
        }

        /**
         * Return this object as a string.
         * @returns {String}
         */
        toString() {
            return this.base;
        }
    }
};