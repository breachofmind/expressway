var glob = require('glob');
var path = require('path');
var utils = require('./utils');

/**
 * The main key store.
 * @type {KeyStore}
 */
var store = new KeyStore();


/**
 * A collection of keys and values.
 * @constructor
 */
function KeyStore()
{
    this.index = {};

    this.app = null;

    /**
     * Replaces variables in the string in order.
     * @param string
     * @param args array|string
     * @returns {string}
     */
    function doReplace(string, args)
    {
        if (! Array.isArray(args)) args = [args];

        for (var i=0; i<args.length; i++)
        {
            string = string.replace("{"+i+"}", args[i]);
        }
        return string;
    }

    /**
     * Return the locale name, or the default locale value.
     * @param localeName string
     * @returns {string}
     */
    function getLocaleValue(localeName)
    {
        return localeName.toLowerCase();
    }

    /**
     * Set a locale key.
     * @param localeName string
     * @param key string
     * @param value string
     * @returns {*}
     */
    this.setKey = function(localeName, key, value)
    {
        var locale = getLocaleValue(localeName);

        return this.index[locale][key] = value;
    };

    /**
     * Get a locale key.
     * @param localeName string
     * @param key string
     * @param args array
     * @returns {*}
     */
    this.getKey = function(localeName, key, args)
    {
        var locale = getLocaleValue(localeName);

        if (this.hasLocale(locale)) {
            var value = this.index[locale][key];

            if (value) {
                return args ? doReplace(value, args) : value;
            }
        }

        return "undefined:"+locale+"."+key;
    };

    /**
     * Create a locale index.
     * @param localeName string
     * @returns {KeyStore}
     */
    this.setLocale = function(localeName)
    {
        this.index[ getLocaleValue(localeName) ] = {};
        return this;
    };

    /**
     * Check if the locale exists in the index.
     * @param localeName string
     * @returns {boolean}
     */
    this.hasLocale = function(localeName)
    {
        return this.index.hasOwnProperty( getLocaleValue(localeName) );
    };

    /**
     * Return all the keys for the given locale.
     * @param localeName string
     * @returns {*|null}
     */
    this.getLocale = function(localeName)
    {
        return this.index[ getLocaleValue(localeName) ] || null;
    };

    /**
     * Index a locale directory, where the directory name is the locale name.
     * @param dirName string
     */
    this.setLocaleDir = function(dirName)
    {
        var store = this;

        var localeName = path.basename(dirName);
        this.setLocale(localeName);

        var files = utils.getFileBaseNames(dirName+"/");

        files.forEach(function(file)
        {
            var lang = require(dirName+"/"+file);

            var index=0;
            for (var prop in lang)
            {
                if (! lang.hasOwnProperty(prop)) {
                    continue;
                }
                store.setKey(localeName, file+"."+prop, lang[prop]);
                index++;
            }
            store.app.logger.debug("Loaded Language File: %s.%s (%d keys)", localeName, file, index);
        });
    }

}

module.exports = {

    /**
     * Initializes the locale functionality.
     * @param app Application
     * @returns KeyStore
     */
    init: function(app)
    {
        store.app = app;

        var langDirs = glob.sync(app.constructor.rootPath('lang/*'));

        langDirs.forEach(function(dirPath,i)
        {
            store.setLocaleDir(dirPath)
        });

        return store;
    },

    /**
     * The language function.
     * @usage lang("fileName.propertyName", args)
     * @param request
     * @returns {Function}
     */
    lang: function(request)
    {
        var locale = request.locale.toLowerCase();

        return function(key, args) {
            return store.getKey(locale||"en_us", key, args);
        }
    }
};