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
    return class URLService
    {
        constructor(url)
        {
            this._url = url;
        }

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
            return this._url;
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
         * Add properties or methods to this object.
         * @param name string
         * @param path string
         * @returns {URLService}
         */
        extend(name,path)
        {
            if (this.hasOwnProperty(name)) {
                throw new Error(`url.${name} method exists`);
            }
            this[name] = (uri) => {
                return this.get([path,uri]);
            };

            return this;
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