"use strict";

var glob = require('glob');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var os = require('os');

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
    let $inject,
        fnText,
        assign = true,
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
                    // This will affect other parent constructors.
                    // So, we will not assign the $inject array.
                    assign = false;
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

            fn.$inject = assign ? $inject : null;
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
            typeof manipulateKey == 'function' ? manipulateKey(key,object[key]) : key,
            object[key]
        );
    });
    return map;
};


/**
 * Convert an object of VERB ROUTE -> MIDDLEWARE to a parsed Map object.
 * @param routes Object
 * @returns {Map}
 */
exports.toRouteMap = function(routes)
{
    return this.toMap(routes, (key,value) =>
    {
        let parts = key.split(/\s+/);
        let [verb,url] = parts;
        // We're just passing a uri instead of a verb and uri.
        if (parts.length == 1) {
            url = verb;
            verb = "GET"
        }
        // This is the key of the map. The value is the middleware.
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
    var out = _.map(object, (value,attrName) => {
        if (value && HTML_ATTR_RX.test(attrName) )
        {
            if (Array.isArray(value)) value = value.join(" ");
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
    function accessor(property,defaultValue=null) {
        return _.get(object, property, defaultValue);
    }
    accessor.get = function(property) {
        return _.get(object,property);
    };
    return accessor;
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
};

/**
 * Get localhost addresses
 * @returns {Array}
 */
exports.getEthAddresses = function()
{
    var ifaces = os.networkInterfaces();
    var addresses = [];
    Object.keys(ifaces).forEach(ifname => {
        var alias = 0;
        ifaces[ifname].forEach(iface => {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            var addr = {name: ifname, alias:null, address:iface.address};

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                addr.alias = alias;
            }
            addresses.push(addr);

            ++alias;
        });
    });
    return addresses;
};

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
            case "mounted_app" :
                let $extension = express.$extension.mounted[rx.path];
                return {
                    rx: rx,
                    path: "*",
                    methods: ["*"],
                    stack: [ ($extension ? $extension.name : "mounted_app") ]
                };
            case "router" :
                return middleware.handle.stack.map(layer => {
                    if (layer.route) {
                        return {
                            rx: rx,
                            path: layer.route.path,
                            methods: Object.keys(layer.route.methods),
                            stack: layer.route.stack.map(middleware => {
                                return middleware.handle.$name;
                            })
                        };
                    }
                    return {
                        rx: rx,
                        path: exports.parseRouteRegexp(layer.regexp).path,
                        methods: ["*"],
                        stack: [layer.handle.$name]
                    }

                });
            case "middleware" :
            case "controllerRoute" :
                return {
                    rx: rx,
                    path: "*",
                    methods: ["*"],
                    stack: [middleware.handle.$name],
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
 * Check if the current platform is windows.
 * @returns {boolean}
 */
exports.isWindows = function()
{
    return /^win/.test(process.platform);
};

/**
 * Return an array from an object.
 * @param object
 * @returns {Array}
 */
exports.arrayFromObject = function(object)
{
    return Object.keys(object).map((key,index) => {
        return {
            index: index,
            key: key,
            value: object[key]
        }
    })
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
    if (!opts.text) opts.text = "";
    var el = elementName.toLowerCase();
    var attrs = exports.spreadAttributes(opts.attr);
    var str = `<${el}`;
    if (attrs.length) str+= " "+attrs;
    str += (HTML_EMPTY_ELEMENTS.indexOf(el) > -1 ? `/>` : `>${opts.text}</${el}>`);
    return str;
};

/**
 * Default middleware that goes to the next middleware.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.goToNext = function(req,res,next)
{
    return next();
};

/**
 * Flatten and remove any false values of an array.
 * @param array Array
 * @returns {Array}
 */
exports.compound = function(array)
{
    return _.compact( _.flattenDeep(array) );
};

/**
 * Cast the given value to a array, if it isn't an array.
 * @param value *
 * @param flatten boolean
 * @returns {Array}
 */
exports.castToArray = function(value, flatten=false)
{
    if (!value) return [];

    if (! Array.isArray(value)) {
        value = [value];
    }
    return flatten ? _.compact( _.flattenDeep(value) ) : value;
};

/**
 * No op function.
 * @returns {null}
 */
exports.noop = function()
{
    return null;
};

/**
 * A little timer guy.
 * @returns {*}
 */
exports.timer = function()
{
    let start = Date.now();
    return {
        lap() {
            let end = Date.now();
            return ((end-start)/1000).toFixed(3) + " sec";
        }
    }
};