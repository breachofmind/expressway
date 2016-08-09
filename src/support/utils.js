var glob = require('glob');
var path = require('path');

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