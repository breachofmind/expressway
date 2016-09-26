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

        this.models = [];
    }

    register(app)
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
                this[instance.name] = instance;
                this.models.push(instance.name);
            }

        }.bind(this));
    }

    /**
     * Check if a model name was loaded.
     * @param modelName string
     * @returns {boolean}
     */
    has(modelName)
    {
        return this.models.indexOf(modelName) > -1;
    }

    /**
     * Get a model by slug name.
     * @param slug string
     * @returns {*}
     */
    bySlug(slug)
    {
        for(let i=0; i<this.models.length; i++) {
            var Model = this[this.models[i]];
            if (Model.slug == slug) {
                return Model;
            }
        }
        return null;
    }

    /**
     * Call a callback on each model.
     * @param callback function
     */
    each(callback)
    {
        this.models.forEach(function(modelName) {
            var model = this[modelName];
            callback(model);
        }.bind(this));
    }

}

module.exports = new ORMProvider();