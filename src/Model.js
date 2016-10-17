"use strict";

var Expressway  = require('expressway');
var Collection  = require('./support/Collection');
var _ = require('lodash');

/**
 * The base model class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Model
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        this._booted = false;

        /**
         * Instance of the application.
         * @type Application
         */
        this.app = app;

        /**
         * Instance of the database class being used.
         * @type *
         */
        this.db = app.get('db');

        /**
         * The name of the model, which is usually the constructor name.
         * @type string
         */
        this.name = this.constructor.name;

        /**
         * The slugified version of the model name, for use in URL's.
         * @type string
         */
        this.slug = _.kebabCase(this.name);

        /**
         * The table or collection name for this model.
         * @type {string}
         */
        this.table = this.name.toLowerCase();

        /**
         * The schema, or list of columns and field types.
         * @type {{}}
         */
        this.schema = {};

        /**
         * The model instance, which does the interacting with the database.
         * This depends on the driver being used, ie mysql|mongodb
         * @type {object}
         */
        this.model = null;

        /**
         * The field representing the "title" of the model.
         * @type {string}
         */
        this.title = "id";

        /**
         * Expose this model to the public API?
         * @type {boolean}
         */
        this.expose = true;

        /**
         * Is this model type owned by users?
         * Use the string field name that represents the "user.id" or "author.id" field.
         * @type {false|string}
         */
        this.managed = false;

        /**
         * Fields that do not display in the JSON result set.
         * @type {Array}
         */
        this.guarded = [];

        /**
         * Fields that display in the JSON result set.
         * @type {Array}
         */
        this.fillable = [];

        /**
         * Fields or functions that append tot he JSON result set.
         * If using a custom function, pass in [fieldName, function].
         * @type {Array}
         */
        this.appends = [];

        /**
         * Fields that represent joins with other tables.
         * @type {Array}
         */
        this.populate = [];

        /**
         * For range-based pagination, the key field to sort on.
         * @type {string}
         */
        this.key = "id";

        /**
         * For range-based pagination, the sort direction.
         * @type {number} 1|-1
         */
        this.sort = 1;

        /**
         * Methods attached to this model.
         * Note: "this" corresponds to the model in the function body.
         * @type {{}}
         */
        this.methods = {};
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
     * Helper method to set all columns in the schema as fillable.
     * @param object
     * @return Model
     */
    setSchema(object)
    {
        this.fillable = Object.keys(object);
        this.schema = object;
        return this;
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
     * Get a model object by name.
     * @param modelName string
     * @returns {null|Model}
     */
    static get(modelName)
    {
        return Expressway.instance.app.get('ModelProvider').models[modelName];
    }
}

module.exports = Model;