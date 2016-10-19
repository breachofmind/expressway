"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var debug = app.get('debug');
var utils = Expressway.utils;
var glob = require('glob');
var path = require('path');
var pathService = app.get('path');

class Localization
{
    constructor()
    {
        this.index = {};

        this.langPath = pathService.locales('/');

        this.langDirs = glob.sync(this.langPath + "*");

        this.langDirs.forEach(function(dirName) {
            this.setLocaleDir(dirName);
        }.bind(this));
    }

    /**
     * Index a locale directory, where the directory name is the locale name.
     * @param dirName string
     */
    setLocaleDir(dirName)
    {
        var localeName = path.basename(dirName);
        this.setLocale(localeName);

        var files = utils.getFileBaseNames(dirName+"/");

        files.forEach(function(file)
        {
            var hash = require(dirName+"/"+file);

            var count = this.setKeys(localeName, file, hash);

            debug(this, "Loaded File: %s.%s (%s keys)", localeName, file, count);

        }.bind(this));
    }

    /**
     * Set a locale key.
     * @param localeName string
     * @param key string
     * @param value string
     * @returns {*}
     */
    setKey(localeName, key, value)
    {
        var locale = Localization.getLocaleValue(localeName);

        return this.index[locale][key] = value;
    };

    /**
     * Set multiple keys for a locale.
     * @param localeName string
     * @param file string
     * @param hash object
     * @returns {Number}
     */
    setKeys(localeName, file, hash)
    {
        var keys = Object.keys(hash);
        for (let i=0; i< keys.length; i++) {
            this.setKey(localeName, `${file}.${keys[i]}`, hash[keys[i]]);
        }
        return keys.length;;
    }

    /**
     * Get a locale key.
     * @param localeName string
     * @param key string
     * @param args array
     * @returns {*}
     */
    getKey(localeName, key, args)
    {
        var locale =  Localization.getLocaleValue(localeName);

        if (this.hasLocale(locale)) {
            var value = this.index[locale][key];

            if (value) {
                return args ?  Localization.doReplace(value, args) : value;
            }
        }

        return "undefined:"+locale+"."+key;
    };



    /**
     * Check if the locale exists in the index.
     * @param localeName string
     * @returns {boolean}
     */
    hasLocale(localeName)
    {
        return this.index.hasOwnProperty(  Localization.getLocaleValue(localeName) );
    };

    /**
     * Return all the keys for the given locale.
     * @param localeName string
     * @returns {*|null}
     */
    getLocale(localeName)
    {
        return this.index[  Localization.getLocaleValue(localeName) ] || null;
    };

    /**
     * Create a locale index.
     * @param localeName string
     * @returns {Localization}
     */
    setLocale(localeName)
    {
        this.index[  Localization.getLocaleValue(localeName) ] = {};
        return this;
    }

    /**
     * Return a helper function for retrieving a key.
     * @param request
     * @returns {Function}
     */
    helper(request)
    {
        var locale = request.locale.toLowerCase();

        return function(key,args) {
            if (! key || key=="") return "";
            if (! locale) locale = "en_us";

            return this.getKey(locale,key,args);

        }.bind(this);
    }

    /**
     * Return the locale name, or the default locale value.
     * @param localeName string
     * @returns {string}
     */
    static getLocaleValue(localeName)
    {
        return localeName.toLowerCase();
    }

    /**
     * Replaces variables in the string in order.
     * @param string
     * @param args array|string
     * @returns {string}
     */
    static doReplace(string, args)
    {
        if (! Array.isArray(args)) args = [args];

        for (var i=0; i<args.length; i++)
        {
            string = string.replace("{"+i+"}", args[i]);
        }
        return string;
    }



    /**
     * Return some express middleware.
     * @returns {function(this:Localization)}
     */
    get middleware()
    {
        return function (request,response,next) {
            request.lang = this.helper(request);
            next();
        }.bind(this);
    }
}

module.exports = Localization;