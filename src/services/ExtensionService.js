"use strict";

var Extension       = require('../Extension');
var ObjectCollection = require('../ObjectCollection');

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

            this.on('add', (app,name,value) =>
            {
                // If it also has an alias, make sure to add that too.
                if (value.alias) {
                    app.service(value.alias, value);
                    this.aliases[value.alias] = value;
                }
                debug("ExtensionService added: %s", name);
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

            return this.each(item => {
                return {
                    index: item.index,
                    name: item.object.name,
                    stack: utils.getMiddlewareStack(item.object.express)
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
         * @returns void
         */
        boot()
        {
            this.each(item => {
                this.app.call(item.object,'boot');
            });
        }
    }
};