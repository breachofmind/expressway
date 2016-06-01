/**
 * Helper methods.
 * @author Mike Adamczyk <mike@bom.us>
 */

/**
 * Compact an objects properties to the given array.
 * @param object
 * @param properties array
 * @returns {{}}
 */
function compact(object,properties)
{
    var out = {};
    properties.forEach(function(prop) {
        out[prop] = object[prop];
    });
    return out;
}

function url(uri)
{
    var config = require('../application').instance.config;
    if (!uri) uri = "";
    return `${config.url}:${config.port}/${uri}`;
}

module.exports = {
    compact: compact,
    url: url
};