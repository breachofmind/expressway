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

const HTML_ATTR_RX = /^[a-zA-Z_:][-a-zA-Z0-9_:.]/;
const HTML_EMPTY_ELEMENTS = [
    'area','base','br','col',
    'colgroup','command','embed',
    'hr','img','input','keygen',
    'link','meta','param','source',
    'track','wbr'
];

/**
 * Adapted Function that angular uses to read function args names
 * @param fn Function (can also be method name)
 * @returns {*}
 */
exports.annotate = function(fn)
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
};


/**
 * Compact an objects properties to the given array.
 * @param object
 * @param properties array
 * @returns {{}}
 */
exports.compact = function(object,properties)
{
    var out = {};
    properties.forEach(function(prop) {
        out[prop] = object[prop];
    });
    return out;
};


/**
 * Encode a string to base64.
 * @param string
 * @returns {string}
 */
exports.toBase64 = function(string)
{
    return new Buffer(string).toString('base64');
};

/**
 * Decode a string from base64.
 * @param string
 * @returns {string}
 */
exports.fromBase64 = function(string)
{
    return new Buffer(string,'base64').toString('utf-8');
};


/**
 * Create a Map out of a object.
 * @param object {Object}
 * @param manipulateKey {Function} optional
 * @returns {Map}
 */
exports.toMap = function(object, manipulateKey)
{
    var map = new Map();
    Object.keys(object).forEach(key => {
        map.set(
            typeof manipulateKey == 'function' ? manipulateKey(key) : key,
            object[key]
        );
    });
    return map;
};


/**
 * Convert an object of VERB ROUTE -> MIDDLEWARE to a parsed Map object.
 * @param routes
 * @return Map
 */
exports.toRouteMap = function(routes)
{
    return this.toMap(routes, (key) => {
        var [verb,url] = key.split(/\s+/);
        return {verb:verb.toLowerCase().trim(), url:url.trim()};
    });
};


/**
 * When building an element, spreads the object into attribute values.
 * Ignores keys that being with invalid characters.
 * @param object
 * @returns {string}
 */
exports.spreadAttributes = function(object)
{
    var out = Object.keys(object).map(function(attrName){
        var value = object[attrName];
        if (value && HTML_ATTR_RX.test(attrName) ) {
            return `${attrName}="${value}"`;
        }
    });
    return _.compact(out).join(" ");
};


/**
 * Return just the file basenames (without the .js).
 * @param dir string
 * @returns {*}
 */
exports.getFileBaseNames = function(dir)
{
    var files = glob.sync(dir+"*.js");

    return files.map(function(file) {
        return path.basename(file,".js");
    });
};

/**
 * Return the complete path to the modules in a directory.
 * @param dir string
 * @param callback func|boolean - make true to require the module
 * @returns {array}
 */
exports.getModules = function(dir,callback)
{
    return this.getFileBaseNames(dir).map(function(name)
    {
        var modulePath = dir + name;
        if (callback === true) {
            return require(modulePath);
        }
        return callback ? callback(modulePath, dir, name) : modulePath;
    })
};


/**
 * Given a directory, return a hash where the keyname is the file name of the module.
 * If callback is true, require the module and store under the key.
 * @param dir string
 * @param callback function
 * @returns {{}}
 */
exports.getModulesAsHash = function(dir,callback)
{
    var out = {};
    this.getModules(dir, function(modulePath,dir,name) {
        out[name] = callback === true ? require(modulePath) : callback(modulePath,dir,name);
    });
    return out;
};


/**
 * Return a lodash accessor helper for an object.
 * @param object
 * @returns {Function}
 */
exports.objectAccessor = function(object)
{
    return function (property,defaultValue=null) {
        return _.get(object,property, defaultValue);
    }
};

/**
 * Given a route from express router,
 * parse the given regex.
 * @param rx
 * @returns {{path: string, flags: (number|*|string|String|string)}}
 */
exports.parseRouteRegexp = function(rx)
{
    var flags = rx.flags;
    var lookahead = "?(?=/|$)";
    var str = rx.toString()
        .replace(/\\/g, "")
        .replace(lookahead, "");

    str = _.trimStart(str,"/^");
    str = _.trimEnd(str,"/"+flags);

    return {path: "/"+str, flags:flags}
}

/**
 * Given an express app, return an array of routes.
 * @param express App
 * @returns {Array}
 */
exports.getMiddlewareStack = function(express)
{
    if (! express._router) {
        throw new Error ("Express app does not have a router");
    }
    var stack = express._router.stack;

    var routes = stack.map(function(middleware) {

        var rx = exports.parseRouteRegexp(middleware.regexp);

        switch(middleware.name)
        {
            case "router" :
                return middleware.handle.stack.map(layer => {
                    return {
                        rx: rx,
                        path: layer.route.path,
                        methods: Object.keys(layer.route.methods),
                        stack: layer.route.stack.map(middleware => {
                            return middleware.handle.$route;
                        })
                    };
                });
            case "middleware" :

                return {
                    rx: rx,
                    path: "*",
                    methods: ["*"],
                    stack: [middleware.handle.$route]
                };
            default:
                return {
                    rx: rx,
                    path: "*",
                    methods: ["*"],
                    stack: [middleware.name]
                }
        }
    });

    return _.compact(_.flatten(routes));
};


/**
 * Convert each item in an array to a string.
 * @param array Array
 * @returns {Array}
 */
exports.toStringEach = function(array)
{
    return array.map(item => { return item.toString() });
};


/**
 * Sort by ascending or descending property.
 * @param direction Number 1|-1
 * @param property string
 * @returns {Function}
 */
exports.sortByDirection = function(direction=1,property)
{
    return function(a,b) {
        return a[property] == b[property] ? 0 : (a[property] > b[property] ? direction: -direction);
    }
};

/**
 * Sort an array of strings in asc or desc order.
 * @param direction Number 1|-1
 * @returns {Function}
 */
exports.sortString = function(direction=1)
{
    return function(a,b) {
        return direction == 1 ? a.localeCompare(b) : b.localeCompare(a);
    }
};

/**
 * Alphabetize a object based on the keys in the object.
 * Returns a new object with sorted keys.
 * @param object Object
 * @returns {{}}
 */
exports.alphabetizeKeys = function(object)
{
    var out = {};
    Object.keys(object).sort(exports.sortString(1)).forEach(key => {
        out[key] = object[key];
    });
    return out;
};

/**
 * Create an XML/HTML element.
 * @param elementName string
 * @param opts object
 * @returns {string}
 */
exports.element = function(elementName,opts={})
{
    if (!opts.$text) opts.$text = "";
    var el = elementName.toLowerCase();
    var attrs = exports.spreadAttributes(opts);
    var str = `<${el}`;
    if (attrs.length) str+= " "+attrs;
    str += (HTML_EMPTY_ELEMENTS.indexOf(el) > -1 ? `/>` : `>${opts.$text}</${el}>`);
    return str;
};