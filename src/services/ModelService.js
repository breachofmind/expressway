"use strict";

var Model = require('../Model');
var ObjectCollection = require('../ObjectCollection');

module.exports = function(app,debug)
{
    /**
     * A collection of models.
     */
    return new class ModelService extends ObjectCollection
    {
        constructor()
        {
            super(app,'model');

            this.class = Model;
            this.slugs = {};
            this.createService = true;

            this.on('add', (app,name,value) => {
                debug('ModelService added: %s -> %s', name, value.slug);
                this.slugs[value.slug] = value;
            })
        }

        /**
         * Boot each model.
         * @returns void
         */
        boot()
        {
            this.each(model => {
                this.app.call(model,'boot');
                debug('Model booted: %s', model.name);
            });
        }

        /**
         * Get a model by the slug name.
         * @param name string
         * @returns {Model}
         */
        slug(name)
        {
            if (! this.slugs.hasOwnProperty(name)) {
                throw new Error(`slug does not exist: ${name}`);
            }
            return this.slugs[name];
        }
    }
};