"use strict";

var _ = require('lodash');
var utils = require('./support/utils');

/**
 * The base model class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Model
{
    /**
     * Constructor.
     * @injectable
     * @param app
     */
    constructor(app)
    {
        this._app = app;

        this._booted = false;

        /**
         * The model instance, which does the interacting with the database.
         * This depends on the driver being used, ie mysql|mongodb
         * @type {object}
         */
        this._model = null;

        /**
         * The default primary key field name.
         * @type {string}
         */
        this.primaryKey = "_id";

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
         * The field representing the "title" of the model.
         * @type {string}
         */
        this.title = "_id";

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
         * The most recent compiled schema and methods.
         * @type {{}}
         * @private
         */
        this.__schema = {};
        this.__methods = {};
        this.__old = {schema:{}, methods:{}};
    }

    /**
     * Get the Application instance.
     * @returns {Application}
     */
    get app() { return this._app; }

    /**
     * Get the database instance.
     * @returns {Mongoose}
     */
    get db() { return this.app.db; }

    /**
     * Return the name of the object.
     * @returns String
     */
    get name() { return this.constructor.name; }

    /**
     * Check if this model is booted.
     * @returns {boolean}
     */
    get booted() { return this._booted; }

    /**
     * Return the mongoose model.
     * @returns {Object}
     */
    get model() { return this._model; }


    /**
     * Get the schema object.
     * @injectable
     * @returns {Object}
     */
    schema()
    {
        return {
            created_at   : { type: Date, default: Date.now },
            modified_at  : { type: Date, default: Date.now },
            [this.title] : { type: String, required: true }
        }
    }

    /**
     * Return the field labels.
     * @param array
     * @returns {Array}
     */
    fields(array=[])
    {
        return array;
    }


    /**
     * Get the methods object.
     * @injectable
     * @returns {Object}
     */
    methods(object)
    {
        let self = this;

        let methods = {
            /**
             * The default toJSON method.
             * @returns {{}}
             */
            toJSON() {

                let json = {
                    id:     this.id,
                    $title: this[self.title],
                };

                self.fillable.forEach(field =>
                {
                    // Skip fields that are in the guarded column.
                    if (self.guarded.indexOf(field) > -1) {
                        return;
                    }

                    return json[field] = typeof this[field] == 'undefined' ? null : this[field];
                });

                // The developer can append other columns to the output.
                self.appends.forEach(field =>
                {
                    // This is a computed property.
                    if (typeof field == 'function') {
                        let arr = field.apply(this,[this,self]);
                        if (Array.isArray(arr)) {
                            return json[arr[0]] = arr[1];
                        }
                    }
                    // This is a method call or property from the object.
                    if (this[field]) {
                        return json[field] = typeof this[field] == 'function' ? this[field]() : this[field];
                    }

                });

                return utils.alphabetizeKeys(json);
            }
        }

        return _.assign({},methods,object);
    }

    /**
     * Get the sorting range.
     * @returns {{}}
     */
    get range()
    {
        return {[this.key]: this.sort};
    }

    /**
     * Return an object for a filter query.
     * @param value string from ?p
     * @returns {{}}
     */
    paging(value)
    {
        let query = this.sort ==1 ? {$gt:value} : {$lt:value};

        return {[this.key]: query};
    };

    /**
     * Boot the model.
     * @injectable
     * @params done Function
     * @returns {boolean}
     */
    boot(done)
    {
        if (! this.booted) this.refresh();

        this._booted = true;
        done();
    }

    /**
     * Assign a new schema and model instance.
     * @returns void
     */
    refresh()
    {
        // Unregister and re-register the models.
        if (this.db.models[this.name]) {
            delete this.db.models[this.name];
            delete this.db.modelSchemas[this.name];
        }

        // Create a reference to the previous state.
        this.__old.schema  = this.__schema;
        this.__old.methods = this.__methods;

        this.__schema  = this.app.call(this,'schema',[{}]);
        this.__methods = this.app.call(this,'methods',[{}]);

        this.app.emit('schema.create', this);

        let schema = new this.db.Schema(this.__schema, {collection: this.table});
        this.booting(schema);
        schema.virtual('$base').get(() => {return this});

        if (this.fillable.length == 0) {
            this.fillable = Object.keys(this.__schema);
        }
        schema.methods = this.__methods;

        this._model = this.db.model(this.name, schema);
    }

    /**
     * Modify the Schema object before attaching to the model.
     * @param schema
     */
    booting(schema)
    {
        // Unimplemented
    }
}


const POPULATE_METHODS = ['find','findOne','findById'];

// Attach the mongoose methods to the blueprint.
['find','findOne','findById','findByIdAndUpdate','count','remove','create','update'].forEach(method =>
{
    Model.prototype[method] = function() {
        var out = this.model[method] (...arguments);
        if (POPULATE_METHODS.indexOf(method) > -1) {
            out.populate(this.populate).sort(this.range);
        }
        return out;
    }
});

module.exports = Model;