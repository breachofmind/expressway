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
     * @param ControllerProvider ControllerProvider
     * @returns {Array}
     */
    getRouteFunctions: function(values, ControllerProvider)
    {
        var out = [];

        if (! Array.isArray(values)) values = [values];

        values.forEach(function(value)
        {
            // "indexController.index"
            // dispatch method should return an array of functions.
            if (typeof value == 'string') {
                out = out.concat( ControllerProvider.dispatch.apply(ControllerProvider, value.split(".",2)) );
            }
            // function(request,response,next) {...}
            if (typeof value == 'function') {
                out.push(value);
            }
        });

        // Return the stack of middleware and the route request.
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
    },

    /**
     * Return the complete path to the modules in a directory.
     * @param dir string
     * @param callback func|boolean - make true to require the module
     * @returns {array}
     */
    getModules: function(dir,callback)
    {

        return this.getFileBaseNames(dir).map(function(name) {
            var module = dir + name;
            if (callback === true) {

                try {
                    return require(module);
                } catch (e) {
                    return e;
                }

            }
            return callback ? callback(module) : module;
        })
    },

    /**
     * Call a method on each item in the array.
     * @param array array
     * @param method string
     * @param args mixed
     */
    callOnEach: function(array, method, args)
    {
        console.log(method);
        array.forEach(function(object) {
            object[method].call(object,args);
        });
    }
};