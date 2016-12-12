"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var app = Expressway.instance.app;
var debug = app.get('debug');

/**
 * Handles the storage and retrieval of controller classes.
 * @author Mike Adamczyk <mike@bom.us>
 * @since 0.6.0
 */
class ModelService
{
    constructor()
    {
        this.models = {};
    }

    /**
     * Check if the given controller is in the index.
     * @param modelName string
     * @returns {boolean}
     */
    has(modelName)
    {
        return this.models.hasOwnProperty(modelName);
    }

    /**
     * Call the boot method on each model.
     * @returns {boolean}
     */
    boot()
    {
        Object.keys(this.models).forEach(name => {
            this.models[name].boot();
        });
        return true;
    }

    /**
     * Add a new model class.
     * @param model string|Model
     * @throws Error
     * @returns {Model}
     */
    add(model)
    {
        let path = null;
        if (typeof model == "string") {
            path = model;
            model = require(path);
        }
        let instance = app.call(model);
        if (! (instance instanceof Expressway.Model)) {
            throw new Error("Unable to add model, not a Model instance: "+path);
        }
        debug(this,'Loaded: %s', instance.name);

        // Attach the model name to the service also.
        this[instance.name] = instance;

        return this.models[instance.name] = instance;
    }

    /**
     * Add all files in a directory.
     * @param dir string|PathObject
     */
    addDirectory(dir)
    {
        dir = dir.toString();
        if (! dir.endsWith("/")) dir+="/";
        utils.getModules(dir.toString(), moduleName => {
            this.add(moduleName);
        });
    }

    /**
     * Get a model by slug name.
     * @param slug string
     * @returns {*}
     */
    bySlug(slug)
    {
        let models = this.all();

        for(let i=0; i<models.length; i++)
        {
            var Model = models[i];
            if (Model.slug === slug) {
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
     * Return all the model objects as an array.
     * @returns {Array}
     */
    all()
    {
        return Object.keys(this.models).map(name => {
            return this.models[name];
        });
    }

    /**
     * Get a model by name.
     * @param modelName string
     * @returns {undefined|Model}
     */
    get(modelName)
    {
        return this.models[modelName];
    }
}

module.exports = ModelService;