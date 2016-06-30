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
        var config = require('../application').instance.config;
        if (!uri) uri = "";
        return `${config.url}/${uri}`;
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
    }
};