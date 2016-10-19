"use strict";

var Expressway = require('expressway');
var utils      = require('../support/utils');

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'CoreProvider',
            'DriverProvider'
        ];

        this.order = 1;

        this.models = {};
    }


    /**
     * Register the provider with the application.
     * @param app Application
     * @param debug function
     * @param DriverProvider DriverProvider
     * @param event EventEmitter
     */
    register(app,debug,DriverProvider,event)
    {
        app.register('ModelProvider', this, "Model Provider instance, for getting/setting models");

        debug(this,'Using driver: %s', DriverProvider.alias);

        // Expose the Driver model class.
        Expressway.Model = DriverProvider.Model;
        app.register('Model', DriverProvider.Model, "The Model class, an extension of the core BaseModel");

        event.once('providers.registered', app => {
            app.register('Models', app.call(this,'loadModels'), "An object containing all loaded Model instances");
        })

    }

    /**
     * Load all models.
     * @param app Application
     * @param debug function
     * @param Model
     * @param path PathService
     * @param event EventEmitter
     * @returns {object}
     */
    loadModels(app, debug, Model, path, event)
    {
        utils.getModules(path.models("/"), path =>
        {
            var Class = require(path);
            var instance = app.call(Class);

            if (! (instance instanceof Expressway.Model)) {
                throw (path + " module does not return Model instance");
            }

            instance.boot();

            this.models[instance.name] = instance;

            debug(this,'Loaded: %s', instance.name);

        });

        event.emit('models.loaded', app);

        return this.models;
    }

    /**
     * Check if a model name was loaded.
     * @param modelName string
     * @returns {boolean}
     */
    hasModel(modelName)
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

module.exports = ModelProvider;