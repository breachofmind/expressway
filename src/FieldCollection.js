"use strict";

var EventEmitter = require('events');
var Field        = require('./Field');
var _            = require('lodash');


class FieldCollection extends EventEmitter
{
    constructor(model,driver)
    {
        super();

        this._model = model;
        this._driver = driver;
        this._fields = {};
        this._counter = 0;
    }

    /**
     * Get the type functions from the driver.
     * @returns {*|String[]}
     */
    get types()
    {
        return this._driver.types;
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
     * Get the protected driver instance.
     * @returns {Driver}
     */
    get driver()
    {
        return this._driver;
    }

    /**
     * Return an array of field names.
     * @returns {Array}
     */
    get names()
    {
        return this.each(field => { return field.name });
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
     * Create the schema.
     * @returns {{}}
     */
    toSchema()
    {
        let out = this.driver.schema(this._blueprint, this);

        this.emit('toSchema', out);

        return out;
    }

    /**
     * List the field properties.
     * @returns {{}}
     */
    toProperties()
    {
        let out = {};
        this.each(field => {
            out[field.name] = field.toJSON();
        });
        this.emit('toProperties', out);

        return out;
    }
}

module.exports = FieldCollection;