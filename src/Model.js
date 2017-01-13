"use strict";

var _ = require('lodash');
var utils = require('./support/utils');
var EventEmitter = require('events');
var FieldCollection = require('./FieldCollection');

/**
 * The base model class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Model extends EventEmitter
{
    /**
     * Constructor.
     * @injectable
     * @param app
     */
    constructor(app)
    {
        super();

        /**
         * Application instance.
         * @type Application
         * @private
         */
        this._app = app;

        /**
         * FieldCollection instance.
         * @type {FieldCollection}
         * @private
         */
        this._fields = new FieldCollection(app, this);

        /**
         * Is this model booted?
         * @type {boolean}
         * @private
         */
        this._booted = false;

        /**
         * The database model associated with this blueprint.
         * This is created by the database driver.
         * @type {null|*}
         */
        this.model = null;

        /**
         * Singular form of the model name.
         * @type {String}
         */
        this.singular = _.singularize(this.name);

        /**
         * Plural form of the model name.
         * @type {string}
         */
        this.plural = _.pluralize(this.name);

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
         * Fields that represent joins with other tables.
         * @type {Array}
         */
        this.populate = [];

        /**
         * For range-based pagination, the key field to sort on.
         * @type {string}
         */
        this.key = this.primaryKey;

        /**
         * For range-based pagination, the sort direction.
         * @type {number} 1|-1
         */
        this.sort = 1;

        /**
         * The default model icon.
         * @type {string}
         */
        this.icon = "action.class";

        /**
         * The default group for a model.
         * @type {string}
         */
        this.group = "system";

        /**
         * Model pre/post hooks.
         * @type {Array}
         * @private
         */
        this._hooks = [];
    }

    /**
     * Get the Application instance.
     * @returns {Application}
     */
    get app() { return this._app; }

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
     * Get the schema builder object.
     * @returns {FieldCollection}
     */
    get fields() { return this._fields; }

    /**
     * Return the protected hooks array.
     * @returns {Array}
     */
    get hooks() { return this._hooks; }

    /**
     * Get the sorting range.
     * @returns {{}}
     */
    get range()
    {
        return {[this.key]: this.sort};
    }

    /**
     * Create a new hook.
     * @param fn Function
     * @returns {Model}
     */
    hook(fn)
    {
        this._hooks.push(fn);
        return this;
    }

    /**
     * Edit the FieldCollection object.
     * @injectable
     * @param fields {FieldCollection}
     * @param types Object
     * @returns void
     */
    schema(fields, types)
    {
        // If unimplemented, just adds the title and some timestamps.
        fields.add(this.title, types.Title);
        fields.timestamps();
    }

    /**
     * Get the methods object.
     * @injectable
     * @param object {Object} inherited from parent
     * @returns {Object}
     */
    methods(object)
    {
        let methods = {
            toJSON: defaultToJSONMethod(this)
        };

        return _.assign({},methods,object);
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
     * @params next {Function}
     * @returns {boolean}
     */
    boot(next)
    {
        if (! this._booted) {
            this.app.models.driver.boot(this);
            this.emit('boot');
        }

        this._booted = true;
        next();
    }

    /**
     * Convert this object to a JSON object.
     * @returns {{}}
     */
    toJSON()
    {
        return {
            name: this.name,
            singular: this.singular,
            plural: this.plural,
            slug: this.slug,
            title: this.title,
            icon: this.icon,
            fields: this.fields.toArray()
        }
    }
}


/**
 * The default toJSON() method for a model.
 * @param blueprint Model
 * @returns {Function}
 */
function defaultToJSONMethod(blueprint)
{
    let app = blueprint.app;

    /**
     * @this is the database model.
     */
    return function()
    {
        let json = {
            $title: this[blueprint.title],
        };
        let primaryKey = blueprint.primaryKey;

        if (primaryKey) json[_.trimStart(primaryKey, "_")] = this[primaryKey];

        blueprint.fields.each(field =>
        {
            // Skip fields that are guarded.
            if (field.guarded) return;

            let value = this[field.name];

            json[field.name] = typeof value == 'undefined' ? null : value;
        });

        // App level emitter
        app.emit('model.toJSON', json, blueprint, this);

        // Model level emitter
        blueprint.emit('toJSON', json,blueprint,this);

        return json;
    };
}

module.exports = Model;