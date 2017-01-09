"use strict";

var Extension       = require('../Extension');
var ObjectCollection = require('../ObjectCollection');
var Promise = require('bluebird');

module.exports = function(app,debug,utils)
{
    /**
     * A collection of controller instances.
     */
    return new class ExtensionService extends ObjectCollection
    {
        constructor()
        {
            super(app,'extension');

            this.class = Extension;
            this.createService = true;
            this.aliases = {};

            this.on('add', (name,value) =>
            {
                // If it also has an alias, make sure to add that too.
                if (value.alias) {
                    app.service(value.alias, value);
                    this.aliases[value.alias] = value;
                }
                debug("ExtensionService added: %s -> %s", name, value.alias || "<no alias>");
            });

            this.on('boot', (extension) =>
            {
                debug('ExtensionService booted: %s',extension.name);
            })
        }


        /**
         * Return a human readable list of route stacks for each extension.
         * @returns {Array}
         */
        stacks(moduleName)
        {
            if (moduleName) {
                if (typeof moduleName != "string") {
                    throw new TypeError('module name must be a string');
                }
                return utils.getMiddlewareStack(this.get(moduleName).express);
            }

            return this.each((extension,index,key) => {
                return {
                    index: index,
                    name: extension.name,
                    stack: utils.getMiddlewareStack(extension.express)
                }
            });
        }

        /**
         * Check for an alias first.
         * @param name string
         * @returns {Extension}
         */
        get(name)
        {
            if (this.aliases.hasOwnProperty(name)) return this.aliases[name];
            return super.get(name);
        }

        /**
         * Boot the extensions.
         * @returns {Promise}
         */
        boot()
        {
            return Promise.all(this.each(extension => {
                return new Promise(resolve => {
                    this.emit('boot', extension);
                    this.app.call(extension,'boot',[resolve]);
                })
            }));
        }
    }
};