"use strict";

var expressway = require('expressway');
var BaseModel  = require('../model');
var utils      = require('../support/utils');

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ORMProvider extends expressway.Provider
{
    constructor()
    {
        super('orm');

        this.requires('logger');

        this.inject('Log');

        this.models = {};
    }


    register(app,logger)
    {
        var modelPath = app.rootPath(app.conf('models_path',' models') + "/");

        // Register method will determine which driver to use.
        var Model = BaseModel.register(app);

        // Bind the new Model class for the developer's convenience.
        app.Model = expressway.Model =  Model;

        // Load all models in the models directory.
        utils.getModules(modelPath, function(path)
        {
            var Class = require(path);
            var instance = new Class(app);

            if (! (instance instanceof BaseModel)) {
                throw (path + " module does not return Model instance");
            }
            if (! this.has(instance.name)) {
                instance.boot();
                this.models[instance.name] = instance;

                logger.debug('[Model] Loaded: %s', instance.name);
            }

        }.bind(this));

        app.register('Models', this.models);

        app.event.emit('models.loaded',app, this);
    }

    /**
     * Check if a model name was loaded.
     * @param modelName string
     * @returns {boolean}
     */
    has(modelName)
    {
        return this.models.hasOwnProperty(modelName);
    }

    /**
     * Get a model by slug name.
     * @param slug string
     * @returns {*}
     */
    bySlug(slug)
    {
        var models = this.all();
        for(let i=0; i<models.length; i++) {
            var Model = models[i];
            if (Model.slug == slug) {
                return Model;
            }
        }
        return null;
    }

    /**
     * Call a callback on each model.
     * @param callback function
     * @returns {Array}
     */
    each(callback)
    {
        return this.all().map(function(model) {
            return callback(model);
        });
    }

    /**
     * Return all the model objects.
     * @returns {Array}
     */
    all()
    {
        var keys = Object.keys(this.models);
        return keys.map(function(key) {
            return this.models[key];
        }.bind(this));
    }
}

module.exports = new ORMProvider();