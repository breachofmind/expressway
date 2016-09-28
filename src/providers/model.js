"use strict";

var _          = require('lodash');
var Collection = require('../support/collection');
var expressway = require('expressway');
var utils      = require('../support/utils');

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.requires = [
            'LoggerProvider',
        ];

        this.inject = ['log','events'];

        this.models = {};
        this.driver = null;
    }


    /**
     * Register the provider with the application.
     * @param app Application
     * @param log Winston
     * @param event EventEmitter
     */
    register(app,log,event)
    {
        app.register('ModelProvider', this);
        app.register('BaseModel', app.call(this,'getModelClass',[app]));

        var driverName = app.conf('db_driver', 'mongo');
        var driver = require('../drivers/'+driverName);
        var Model = driver.register(app);

        log.debug('[Model] Using driver: %s', driver.name);

        this.driver = driver;

        // Expose the Driver model class.
        expressway.Model = Model;
        app.register('Model', Model);

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
     * Return the base model class.
     * @param app Application
     * @returns {BaseModel}
     */
    getModelClass(app)
    {
        var ModelProvider = this;

        return class BaseModel
        {
            constructor(app)
            {
                this._booted = false;
                this._schema = {};
                this._model = null;

                this.app = app;
                this.name = this.constructor.name;
                this.slug = _.snakeCase(this.name);
                this.title = "id";
                this.expose = true;
                this.managed = false;
                this.guarded = [];
                this.fillable = [];
                this.appends = [];
                this.populate = [];
                this.labels = {};
                this.key = "id";
                this.sort = 1;

                this.methods = {};

                ModelProvider.models[this.name] = this;
            }

            /**
             * The default collection for this model.
             * @param modelArray
             * @returns {exports|module.exports}
             */
            collection(modelArray)
            {
                return new Collection(modelArray, this);
            }

            /**
             * Get the sorting range.
             * @returns {{}}
             */
            get range()
            {
                var out = {}; out[this.key] = this.sort;
                return out;
            }

            /**
             * Return an object for a filter query.
             * @param value string from ?p
             * @returns {{}}
             */
            paging(value)
            {
                var q = {};
                q[this.key] = this.sort == 1
                    ? {$gt:value}
                    : {$lt:value};
                return q;
            };

            /**
             * Boot the model.
             * @returns {boolean}
             */
            boot()
            {
                return this._booted = true;
            }

            /**
             * Get a model object by name.
             * @param modelName string
             * @returns {null|Model}
             */
            static get(modelName)
            {
                return ModelProvider.models[modelName];
            }
        }
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

module.exports = new ModelProvider();