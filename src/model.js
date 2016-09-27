"use strict";

var _ = require('lodash');
var expressway = require('expressway');
var Collection = require('./collection');

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
     * Register the model class and get the database driver.
     * @param app Application
     */
    static register(app)
    {
        var logger = app.get('Log');
        var ModelClass = app.conf('db_driver', 'mongo');
        if (typeof ModelClass == 'string') {
            var driver = require('./drivers/'+ModelClass);
            ModelClass = driver(app, Model);
            logger.debug('[Model] Using driver: %s', driver.name);
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
        return expressway.app.get('orm') [modelName];
    }
}

module.exports = Model;