var glob = require('glob');
var path = require('path');
var fs = require('fs');

/**
 * Helper methods.
 * @author Mike Adamczyk <mike@bom.us>
 */
module.exports = {

    /**
     * Compact an objects properties to the given array.
     * @param object
     * @param properties array
     * @returns {{}}
     */
    compact: function(object,properties)
    {
        var out = {};
        properties.forEach(function(prop) {
            out[prop] = object[prop];
        });
        return out;
    },

    /**
     * Return a url string.
     * @param uri string
     * @returns {string}
     */
    url: function(uri)
    {
        var app = require('../application').instance;
        return app.url(uri);
    },

    /**
     * Encode a string to base64.
     * @param string
     * @returns {string}
     */
    toBase64: function(string)
    {
        return new Buffer(string).toString('base64');
    },

    /**
     * Decode a string from base64.
     * @param string
     * @returns {string}
     */
    fromBase64: function(string)
    {
        return new Buffer(string,'base64').toString('utf-8');
    },

    /**
     * Read in a JSON text file.
     * @param file string
     * @return object
     */
    readJSON: function(file)
    {
        var contents = fs.readFileSync(file);
        return JSON.parse(contents);
    },

    /**
     * When building an element, spreads the object into attribute values.
     * @param object
     * @returns {string}
     */
    spreadAttributes: function(object)
    {
        return Object.keys(object).map(function(key){
            var value = object[key];
            if (value) {
                return `${key}="${object[key]}"`;
            }
        }).join(" ");
    },

    /**
     * Given a string or functions, return an array of functions for the express router.
     * @param values
     * @returns {Array}
     */
    getRouteFunctions: function(values)
    {
        var app = require('../application').instance;
        var dispatch = app.ControllerFactory.dispatch;
        var out = [];

        if (! Array.isArray(values)) {
            values = [values];
        }
        values.forEach(function(value)
        {
            if (typeof value == 'string') {
                var parts = value.split(".",2);
                out = out.concat(dispatch.apply(null, parts));
            }
            if (typeof value == 'function') {
                out.push(value);
            }
        });

        return out;
    },

    /**
     * Reach into the configuration.
     * @param key string
     * @param defaultValue mixed
     * @returns {*}
     */
    conf(key,defaultValue)
    {
        var app = require('../application').instance;

        if (app.config[key]) {
            return app.config[key];
        }
        return defaultValue;
    },

    /**
     * Return just the file basenames (without the .js).
     * @param dir string
     * @returns {*}
     */
    getFileBaseNames: function(dir)
    {
        var files = glob.sync(dir+"*.js");

        return files.map(function(file) {
            return path.basename(file,".js");
        });
    }
};