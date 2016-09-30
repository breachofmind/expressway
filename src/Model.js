"use strict";

var Expressway  = require('expressway');
var Collection  = require('./support/Collection');
var _ = require('lodash');

class Model
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

        this.db = app.get('db');
    }

    /**
     * The default collection for this model.
     * @param modelArray
     * @returns {Collection}
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
        var app = Expressway.instance.app;
        return app.get('ModelProvider').models[modelName];
    }
}

module.exports = Model;