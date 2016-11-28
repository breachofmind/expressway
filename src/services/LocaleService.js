"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var utils = Expressway.utils;
var glob = require('glob');
var Path = require('path');

var [path,debug] = app.get('path','debug');

class LocaleService
{
    constructor()
    {
        this.index = {};
    }

    /**
     * Index a locale directory.
     * A locale dir should be a directory of locale folders (en, es, en_fr, etc)
     * Each directory gets added to the index.
     * @param dir string
     */
    addDirectory(dir)
    {
        let dirs = glob.sync(dir + "*");

        dirs.forEach(dirName => {

            let localeName = Path.basename(dirName);
            let files = utils.getFileBaseNames(dirName+"/");

            this.setLocale(localeName);

            files.forEach(file =>
            {
                let abs = dirName+"/"+file;
                let hash  = require(abs);
                let count = this.setKeys(localeName, file, hash);

                debug(this, "Loaded File: %s (%s keys)", abs, count);
            });
        });
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
        var locale = LocaleService.getLocaleValue(localeName);

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
        return Object.keys(hash).map(key => {
            this.setKey(localeName, `${file}.${key}`, hash[key]);
        }).length;
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
        var locale =  LocaleService.getLocaleValue(localeName);

        if (this.hasLocale(locale)) {
            let value = this.index[locale][key];

            if (value) {
                return args ?  LocaleService.doReplace(value, args) : value;
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
        return this.index.hasOwnProperty(  LocaleService.getLocaleValue(localeName) );
    };

    /**
     * Return all the keys for the given locale.
     * @param localeName string
     * @returns {*|null}
     */
    getLocale(localeName)
    {
        return this.index[  LocaleService.getLocaleValue(localeName) ] || null;
    };

    /**
     * Create a locale index.
     * @param localeName string
     * @returns {LocaleService}
     */
    setLocale(localeName)
    {
        if (! this.hasLocale(localeName)) {
            this.index[ LocaleService.getLocaleValue(localeName) ] = {};
        }
    }

    /**
     * Return a helper function for retrieving a key.
     * @param request
     * @returns {Function}
     */
    helper(request)
    {
        return function(key,args)
        {
            if (! key || key=="") return "";

            let locale = LocaleService.getLocaleValue(request.locale);

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
}

module.exports = LocaleService;