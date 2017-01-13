"use strict";

var Field        = require('./Field');
var _            = require('lodash');


class FieldCollection
{
    constructor(app,model)
    {
        this._app = app;
        this._model = model;
        this._fields = {};
        this._counter = 0;
    }

    /**
     * Get the protected Application instance.
     * @returns {Application}
     */
    get app()
    {
        return this._app;
    }

    /**
     * Get the type functions from the driver.
     * @returns {*|String[]}
     */
    get types()
    {
        return this.driver.types;
    }

    /**
     * Return the protected model instance.
     * @returns {Model}
     */
    get model()
    {
        return this._model;
    }

    /**
     * Get the protected Driver instance.
     * @returns {Driver}
     */
    get driver()
    {
        return this.app.models.driver;
    }

    /**
     * Return the protected fields index.
     * @returns {{}}
     */
    get fields()
    {
        return this._fields;
    }

    /**
     * Get the total amount of fields.
     * @returns {Number}
     */
    get length()
    {
        return this.names.length;
    }

    /**
     * Return the field names.
     * @param where {Function} filter
     * @returns {Array}
     */
    names(where)
    {
        return this.each(field => {
            if (typeof where == 'function') {
                return where(field) ? field.name : null;
            }
            return field.name;
        })
    }

    /**
     * Check if a field name is in the index.
     * @param name {String}
     * @returns {boolean}
     */
    has(name)
    {
        return this.fields.hasOwnProperty(name);
    }

    /**
     * Get a field object.
     * @param name {String}
     * @throws Error
     * @returns {Field}
     */
    get(name) {
        if (! this.has(name)) {
            throw new Error('field does not exist');
        }
        return this.fields[name];
    }

    /**
     * Return a count of fields if the field property is true.
     * @param boolProperty {String}
     * @returns {number}
     */
    count(boolProperty)
    {
        let count = 0;
        this.each(field => {
            if (field[boolProperty] === true) count ++;
        });
        return count;
    }

    /**
     * Clear all previously set fields.
     * @returns {FieldCollection}
     */
    clear()
    {
        this._fields = {};
        this._counter = 0;

        return this;
    }

    /**
     * Create a new field.
     * @param name string
     * @param args *
     * @returns {FieldCollection}
     */
    add(name,...args)
    {
        let field = new Field(name,this).use(args);
        this._fields[field.name] = field;
        this._counter ++;

        return this;
    }

    /**
     * Add timestamps.
     * @returns {FieldCollection}
     */
    timestamps()
    {
        return this
            .add('created_at', this.types.Timestamp)
            .add('modified_at', this.types.Timestamp);
    }

    /**
     * Create a slug field.
     * @returns {FieldCollection}
     */
    slug()
    {
        return this.add('slug', this.types.Slug);
    }

    /**
     * Iterate through each field object.
     * @param callback {Function}
     * @returns {Array}
     */
    each(callback)
    {
        return _.compact(_.map(this._fields, (field,name) => {
            return callback(field,name);
        }));
    }

    /**
     * Create an object with the field names as the keys.
     * @param callback {Function}
     * @returns {{}}
     */
    map(callback)
    {
        let out = {};
        this.each(field => {
            let value = callback(field);
            if (value !== undefined) {
                out[field.name] = value;
            }
        });
        return out;
    }

    /**
     * Mass-assign labels to field names.
     * @param object {Object}
     * @returns {FieldCollection}
     */
    labels(object)
    {
        _.each(object, (label,fieldName) => {
            if (this.has(fieldName)) {
                this.get(fieldName).label = label;
            }
        });
        return this;
    }

    /**
     * Return an array of fields ordered by priority.
     * @param filter {Function}
     * @returns {Array<Field>}
     */
    toArray(filter)
    {
        return this.each(field => {
            if (typeof filter == 'function') {
                return filter(field) ? field : null;
            }
            return field;

        }).sort(sortByPriority)
    }
}

/**
 * Sort the fields by priority.
 * @param a {Field}
 * @param b {Field}
 * @returns {number}
 */
function sortByPriority(a,b)
{
    return a.priority == b.priority ? 0 : a.priority > b.priority ? 1 : -1;
}

module.exports = FieldCollection;