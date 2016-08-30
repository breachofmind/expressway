"use strict";

var glob = require('glob');
var path = require('path');
var Provider = require('../provider');

/**
 * Provides Locale support.
 * @author Mike Adamczyk <mike@bom.us>
 */
class LocaleProvider extends Provider
{
    constructor()
    {
        super('locale');

        this.requires([
            'logger',
            'view',
            'express'
        ]);
    }

    register(app)
    {
        /**
         * The main key store.
         * @type {KeyStore}
         */
        var store = new KeyStore();
        var utils = app.utils;
        var langPath = app.conf('locales_path', 'lang');

        // Load the language files.
        var langDirs = glob.sync(app.rootPath(langPath+'/*'));

        langDirs.forEach(function(dirPath,i)
        {
            store.setLocaleDir(dirPath)
        });


        /**
         * A collection of keys and values.
         * @constructor
         */
        function KeyStore()
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
                    app.logger.debug("[Locale] Loaded File: %s.%s (%d keys)", localeName, file, index);
                });
            }

        }

        /**
         * The language function.
         * @usage lang("fileName.propertyName", args)
         * @param request
         * @returns {Function}
         */
        function lang(request)
        {
            var locale = request.locale.toLowerCase();

            return function(key, args) {
                if (! key || key=="") {
                    return "";
                }
                return store.getKey(locale||"en_us", key, args);
            }
        }

        app.locale = store;

        // When each view is created, add the template function.
        app.event.on('view.created', function(view,request) {
            view.data.lang = lang(request);
        });

        // Add the helper function to the request object.
        app.get('express').middlewareStack.push(function localeMiddleware(app) {
            return function(request,response,next) {
                request.lang = lang(request);
                next();
            }
        })
    }
}

module.exports = new LocaleProvider();