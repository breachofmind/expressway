"use strict";

var glob = require('glob');
var path = require('path');
var fs = require('fs');

const FN_ARGS = /\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
const FN_CONSTRUCTOR = /^\s*constructor\(([^\)]*)\)/m;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * Helper methods.
 * @author Mike Adamczyk <mike@bom.us>
 */
module.exports = {

    /**
     * Adapted Function that angular uses to read function args names
     * @param fn Function (can also be method name)
     * @returns {*}
     */
    annotate: function(fn)
    {
        var $inject,
            fnText,
            fnMatch = FN_ARGS,
            argDecl;

        if (typeof fn == 'function')
        {
            if (! ($inject = fn.$inject) ) {
                $inject = [];
                fnText = fn.toString().replace(STRIP_COMMENTS, '').trim();

                if (fnText.startsWith("class")) {
                    fnMatch = FN_CONSTRUCTOR;
                    while(! FN_CONSTRUCTOR.test(fnText)) {
                        fn = fn.prototype.__proto__.constructor;
                        fnText = fn.toString().replace(STRIP_COMMENTS, '').trim();
                    }
                }
                argDecl = fnText.match(fnMatch);
                var parts = argDecl[1].split(FN_ARG_SPLIT);
                parts.forEach(function(arg){
                    arg.replace(FN_ARG, function(all, underscore, name){
                        $inject.push(name);
                    });
                });
                fn.$inject = $inject;
            }
        }
        return $inject;
    },

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
     * @param controllerService ControllerService
     * @returns {Array}
     */
    getRouteFunctions: function(values, controllerService)
    {
        var out = [];

        if (! Array.isArray(values)) values = [values];

        values.forEach(function(value)
        {
            // "indexController.index"
            // dispatch method should return an array of functions.
            if (typeof value == 'string')
            {
                var [controllerName,method] = value.split(".",2);
                var funcs = controllerService.dispatch(controllerName,method);
                funcs[funcs.length-1].$route = value;
                out = out.concat( funcs );
            }
            // function(request,response,next) {...}
            if (typeof value == 'function') {
                value.$route = value.name || 'anonymous';
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
        return this.getFileBaseNames(dir).map(function(name)
        {
            var modulePath = dir + name;
            if (callback === true) {
                return require(modulePath);
            }
            return callback ? callback(modulePath, dir, name) : modulePath;
        })
    },

    /**
     * Given a directory, return a hash where the keyname is the file name of the module.
     * If callback is true, require the module and store under the key.
     * @param dir string
     * @param callback function
     * @returns {{}}
     */
    getModulesAsHash: function(dir,callback)
    {
        var out = {};
        this.getModules(dir, function(modulePath,dir,name) {
            out[name] = callback === true ? require(modulePath) : callback(modulePath,dir,name);
        });
        return out;
    }
};