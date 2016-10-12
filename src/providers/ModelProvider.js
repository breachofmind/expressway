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
        ];

        this.models = {};

        this.driver = null;
    }


    /**
     * Register the provider with the application.
     * @param log Winston
     * @param event EventEmitter
     */
    register(log,event)
    {
        this.app.register('ModelProvider', this);

        var driver = require('../drivers/' + this.app.conf('db_driver', 'mongodb'));

        this.driver = driver.register(this);

        log.debug('[Model] Using driver: %s', driver.name);

        // Expose the Driver model class.
        Expressway.Model = driver.Model;

        this.app.register('Model', driver.Model);

        this.app.call(this,'loadModels');

        this.app.register('Models', this.models);

        event.emit('models.loaded', this.app);
    }

    /**
     * Load all models.
     * @param log Winston
     * @param Model
     */
    loadModels(log,Model)
    {
        var app = this.app;

        var modelPath = app.path('models_path', 'models') + "/";

        utils.getModules(modelPath, function(path)
        {
            var Class = require(path);
            var instance = app.call(Class);

            if (! (instance instanceof Expressway.Model)) {
                throw (path + " module does not return Model instance");
            }

            instance.boot();

            this.models[instance.name] = instance;

            log.debug('[Model] Loaded: %s', instance.name);

        }.bind(this));
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