"use strict";

var app,db,utils;

var models = {};

/**
 * Model Factory class.
 * For making those mongoose models.
 */
class ModelFactory
{
    /**
     * Boot method.
     * @param factory ModelFactory
     */
    static boot(factory)
    {
        if (!app) {
            app = require('./application').instance;
            db = app.db;
            utils = require('./support/utils');
            ModelFactory.types = db.Schema.Types;
        }
    }

    constructor(name,schema)
    {
        ModelFactory.boot(this);

        // Name of the model.
        this.name = name;

        // Column labels, optional.
        this.labels = {};

        this.guarded = [];

        this.fillable = [];

        // Model structure.
        this.fields(schema);

        // Expose to API?
        this.expose = true;

        this.title = 'id';

        // Default ranging field and sort order.
        this.range('_id',1);

        // Reference fields to populate.
        this.population = [];

        models[name.toLowerCase()] = this;
    }

    /**
     * Sets the schema json output.
     */
    setJsonOutput()
    {
        var blueprint = this;

        this.schema.methods.toJSON = function()
        {
            var out = {};
            var model = this;

            blueprint.fillable.forEach(function(column)
            {
                if (typeof column == 'function') {
                    var arr = column(model,blueprint);
                    if (arr) {
                        return out[arr[0]] = arr[1];
                    }
                }
                if (typeof model[column] == "function") {
                    return out[column] = model[column] ();
                }
                // Skip fields that are in the guarded column.
                if (blueprint.guarded.indexOf(column) > -1) {
                    return;
                }
                return out[column] = model[column];
            });

            out['id'] = model._id;
            out['_title'] = out[blueprint.title];
            out['_url'] = utils.url(`api/v1/${blueprint.name.toLowerCase()}/${model._id}`);

            return out;
        }
    }

    /**
     * Append a field to the fillable list
     * @param column string|function
     * @returns {ModelFactory}
     */
    appends(column)
    {
        this.fillable.push(column);

        return this;
    }

    /**
     * Guard a column from being displayed in the JSON string.
     * @param column string
     * @returns {ModelFactory}
     */
    guard(column)
    {
        this.guarded.push(column);

        return this;
    }

    /**
     * Add methods to the model.
     * @param object
     * @returns {ModelFactory}
     */
    methods(object)
    {
        for(let method in object) {
            this.schema.methods[method] = object[method];
        }

        return this;
    }

    fields(schema)
    {
        if (schema) {
            for (var column in schema) {
                this.fillable.push(column);
            }
            this.schema = new db.Schema(schema);
        }
        return this;
    }

    /**
     * Set the range key and sort value.
     * @param key string
     * @param sort int
     * @returns {ModelFactory}
     */
    range(key,sort)
    {
        if (! arguments.length) {
            var out = {}; out[this.key] = this.sort;
            return out;
        }
        this.key = key;
        this.sort = sort || 1;
        this.keyType = this.schema.tree[this.key].type;
        return this;
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
    }

    /**
     * Population settings for this model.
     * @param args array|object
     * @returns {ModelFactory}
     */
    populate(args)
    {
        this.population = args||[];
        return this;
    }

    /**
     * Assign the schema to the model.
     * @returns {ModelFactory}
     */
    build()
    {
        this.setJsonOutput();
        this.model = db.model(this.name,this.schema);

        ModelFactory[this.name] = this.model;

        return this;
    }

    /**
     * Load the given files.
     * @param items array
     * @returns {*}
     */
    static load(items)
    {
        var pathTo = require('./application').rootPath;
        items.forEach(function(file) {
            require(pathTo('models/'+file));
        });
        for(let model in models) {
            models[model].build();
        }

        return models;
    }

    /**
     * Return a ModelFactory object.
     * @param name string
     * @returns {*|null}
     */
    static get(name)
    {
        return models[name.toLowerCase()] || null;
    }

    /**
     * Return the models object.
     * @returns {{}}
     */
    static all()
    {
        return models;
    }

    /**
     * Named constructor.
     * @param name string
     * @param schema object
     * @returns {ModelFactory}
     */
    static create(name, schema)
    {
        return new ModelFactory(name,schema);
    }


}


module.exports = ModelFactory;