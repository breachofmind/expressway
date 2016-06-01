"use strict";

var app,db;

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
            ModelFactory.types = db.Schema.Types;
        }
    }

    constructor(name,schema)
    {
        ModelFactory.boot(this);

        // Name of the model.
        this.name = name;

        // Model structure.
        this.fields(schema);

        // Expose to API?
        this.expose = true;

        // Default ranging field and sort order.
        this.range('_id',1);

        // Reference fields to populate.
        this.population = [];

        models[name.toLowerCase()] = this;
    }

    /**
     * Add methods to the model.
     * @param object
     * @returns {ModelFactory}
     */
    methods(object)
    {
        for(let method in object)
        {
            this.schema.methods[method] = object[method];
        }

        return this;
    }

    fields(schema)
    {
        if (schema) {
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
        this.key = key;
        this.sort = sort || 1;
        this.keyType = this.schema.tree[this.key].type;
        return this;
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
        items.forEach(function(file) {
            require('../app/models/'+file);
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
        return models[name] || null;
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