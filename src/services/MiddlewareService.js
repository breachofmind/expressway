"use strict";

var Middleware       = require('../Middleware');
var ObjectCollection = require('../ObjectCollection');

module.exports = function(app,debug,utils)
{
    /**
     * A collection of middleware instances.
     */
    return new class MiddlewareService extends ObjectCollection
    {
        constructor()
        {
            super(app, 'middleware');

            this.class = Middleware;

            this.on('add', (name,value) => {
                debug("MiddlewareService added: %s", name);
            });
        }

        /**
         * Return middleware functions for the given middleware name.
         * @param name string
         * @param extension Extension
         * @returns {Array}
         */
        dispatch(name, extension)
        {
            return utils.castToArray( this.app.call(this.get(name),'dispatch',[extension]) );
        }
    }
};