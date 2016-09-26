"use strict";

var _ = require('lodash');
var expressway = require('expressway');
var Collection = require('./collection');

var objects = {};

class Model
{
    constructor(app)
    {
        this._app = app;
        this._booted = false;
        this._schema = {};
        this._model = null;

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

        objects[this.name] = this;
        app.logger.debug('[Model] Loaded: %s', this.name);
    }

    /**
     * The default collection for this model.
     * @param modelArray
     * @returns {exports|module.exports}
     */
    newCollection(modelArray)
    {
        return new Collection(modelArray);
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
     * Boot the model.
     * @returns {boolean}
     */
    boot()
    {
        return this._booted = true;
    }

    /**
     * Register the model class and get the database driver.
     * @param app Application
     */
    static register(app)
    {
        Model._app = app;
        var ModelClass = app.conf('db_driver', 'mongo');
        if (typeof ModelClass == 'string') {
            var driver = require('./drivers/'+ModelClass);
            ModelClass = driver(app, Model);
            app.logger.debug('[Model] Using driver: %s', driver.name);
        }
        return ModelClass;
    }

    /**
     * Get a model object by name.
     * @param modelName string
     * @returns {null|Model}
     */
    static get(modelName)
    {
        if (! objects.hasOwnProperty(modelName)) {
            return null;
        }
        return objects[modelName];
    }
}

module.exports = Model;