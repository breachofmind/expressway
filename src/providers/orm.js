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

        this.requires = [
            'LoggerProvider',
            'DriverProvider'
        ];

        this.inject = ['events'];

        this.models = {};
    }


    /**
     * Register the provider with the application.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        app.call(this,'loadModels', [app,'log','Model']);

        app.register('Models', this.models);

        event.emit('models.loaded', app, this);
    }

    /**
     * Load all models.
     * @param app Application
     * @param log Winston
     * @param Model
     */
    loadModels(app,log,Model)
    {
        var modelPath = app.rootPath(app.conf('models_path',' models') + "/");

        utils.getModules(modelPath, function(path)
        {
            var Class = require(path);
            var instance = new Class(app);

            if (! (instance instanceof Model)) {
                throw (path + " module does not return Model instance");
            }
            if (! this.has(instance.name)) {
                instance.boot();
                this.models[instance.name] = instance;

                log.debug('[Model] Loaded: %s', instance.name);
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