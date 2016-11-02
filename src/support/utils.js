"use strict";

var glob = require('glob');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

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
     * Create a Map out of a object.
     * @param object {Object}
     * @param manipulateKey {Function} optional
     * @returns {Map}
     */
    toMap: function(object, manipulateKey)
    {
        var map = new Map();
        Object.keys(object).forEach(key => {
            map.set(
                typeof manipulateKey == 'function' ? manipulateKey(key) : key,
                object[key]
            );
        });
        return map;
    },

    /**
     * Convert an object of VERB ROUTE -> MIDDLEWARE to a parsed Map object.
     * @param routes
     * @return Map
     */
    toRouteMap: function(routes)
    {
        return this.toMap(routes, (key) => {
            var [verb,url] = key.split(/\s+/);
            return {verb:verb.toLowerCase().trim(), url:url.trim()};
        });
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
    },

    /**
     * Return a lodash accessor helper for an object.
     * @param object
     * @returns {Function}
     */
    objectAccessor: function(object)
    {
        return function (property,defaultValue=null) {
            return _.get(object,property, defaultValue);
        }
    },

    /**
     * Given an express app, return an array of routes.
     * @param express App
     * @returns {Array}
     */
    getMiddlewareStack: function(express)
    {
        if (! express._router) {
            throw ("Express app does not have a router");
        }
        var stack = express._router.stack;

        var routes = stack.map(function(middleware) {

            switch(middleware.name)
            {
                case "router" :
                    return middleware.handle.stack.map(layer => {
                        return {
                            path: middleware.handle.$basepath + layer.route.path,
                            methods: Object.keys(layer.route.methods),
                            stack: layer.route.stack.map(middleware => {
                                return middleware.handle.$route;
                            })
                        };
                    });
                case "middleware" :
                    return {
                        path: "*",
                        methods: ["*"],
                        stack: [middleware.handle.$route]
                    };
                default:
                    return {
                        path: "*",
                        methods: ["*"],
                        stack: [middleware.name]
                    }
            }
        });

        return _.compact(_.flatten(routes));
    },

    /**
     * Convert each item in an array to a string.
     * @param array Array
     * @returns {Array}
     */
    toStringEach: function(array) {
        return array.map(item => { return item.toString() });
    }
};



Object.defineProperty(global, '__stack', {
    get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function() {
        return function(n=1) {
            return __stack[n].getLineNumber()
        };
    }
});

Object.defineProperty(global, '__function', {
    get: function() {
        return function(n=1) {
            return __stack[n].getFunctionName();
        }
    }
});