"use strict";

var Provider       = require('../Provider');
var ObjectCollection = require('../ObjectCollection');

module.exports = function(app,debug,utils)
{
    /**
     * A collection of controller instances.
     */
    return new class ProviderService extends ObjectCollection
    {
        constructor()
        {
            super(app,'provider');

            this.class = Provider;

            this.on('add', (app,name,value) => {
                debug('ProviderService added: %s',name);
            });
        }

        /**
         * Return a list of providers.
         * Sort by the provider order property if no sort method given.
         * @param sort Function
         * @returns {Array}
         */
        list(sort)
        {
            if (! sort) sort = function(a,b) {
                return a.object.order == b.object.order ? 0 : a.object.order > b.object.order ? 1 : -1;
            };
            return super.list(sort);
        }

        /**
         * Sort and boot each provider that is loadable.
         * @returns void
         */
        boot()
        {
            this.list().forEach(item =>
            {
                if (item.object.isLoadable(app.env, app.context) && ! item.object.booted) {
                    this.app.call(item.object,'boot');
                    item.object._booted = true;

                    debug('ProviderService booted: %s', item.object.name);
                }
            });
        }
    }
};