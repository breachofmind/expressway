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

            this.on('add', (app,name,value) => {
                debug("ExtensionService added: "+name);
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
                    name: item.name,
                    stack: utils.getMiddlewareStack(item.object.express)
                }
            });
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