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

module.exports = {
    compact: compact
};