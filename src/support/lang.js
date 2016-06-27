var glob = require('glob');
var path = require('path');

var KeyStore = function()
{
    this.index = {};

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
            string = string.replace("{$"+i+"}", args[i]);
        }
        return string;
    }

    /**
     * Set a locale key.
     * @param locale string
     * @param key string
     * @param value string
     * @returns {*}
     */
    this.setKey = function(locale, key, value)
    {
        return this.index[locale][key] = value;
    };

    /**
     * Get a locale key.
     * @param locale string
     * @param key string
     * @param args array
     * @returns {*}
     */
    this.getKey = function(locale, key, args)
    {
        var value = this.index[locale][key];

        if (value) {
            return args ? doReplace(value, args) : value;
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
        this.index[localeName] = {};
        return this;
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

        glob(dirName+"/*.js", function(err,files)
        {
            files.forEach(function(file) {
                if (file == dirName) {
                    return;
                }
                var fileBaseName = path.basename(file,'.js');
                var lang = require(file);
                for (var prop in lang)
                {
                    if (! lang.hasOwnProperty(prop)) {
                        continue;
                    }
                    store.setKey(localeName, fileBaseName+"."+prop, lang[prop]);
                }
            });
        });
    }

};

/**
 * The main key store.
 * @type {KeyStore}
 */
var store = new KeyStore();

module.exports = {

    /**
     * Initializes the locale functionality.
     */
    init: function()
    {
        var Application = require('../application');

        glob(Application.rootPath('lang/*'), function(err,files)
        {
            files.forEach(function(dirPath)
            {
                store.setLocaleDir(dirPath)
            })
        })

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