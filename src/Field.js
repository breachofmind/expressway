"use strict";

var FieldCollection = require('./FieldCollection');
var _ = require('lodash');
var isArray = Array.isArray;

/**
 * Field class.
 */
class Field
{
    constructor(name, collection)
    {
        this.collection = collection;
        this.name       = name;
        this.type       = null;
        this.typeName   = null;
        this.indexed    = false;
        this.required   = false;
        this.guarded    = false;
        this.unique     = false;
        this.display    = false;
        this.fillable   = false;
        this.ref        = null;
        this.label      = this.model.slug + "." + this.name + ".label";
        this.tip        = this.model.slug + "." + this.name + ".tip";
        this.default    = undefined;
        this.child      = null;
        this.priority   = collection._counter;
    }

    /**
     * Get the FieldCollection's model.
     * @returns {Model}
     */
    get model()
    {
        return this.collection.model;
    }

    /**
     * Modify this field's properties.
     * @param value {String|Function|Array|Object}
     * @returns {Field}
     */
    use(value)
    {
        if (! value) return this;

        if (isArray(value)) {
            value.forEach(item => { this.use(item) });
            return this;
        }
        if (typeof value == 'function') {
            if (value.name) this.typeName = value.name;
            return this.use( value.apply(this.collection.types, [this, this.collection]) );

        } else if (typeof value == 'object') {
            _.assign(this,value);

        } else if (typeof value == 'string' && this.hasOwnProperty(value) && typeof this[value] == 'boolean') {
            this[value] = true;

        } else if (typeof value == 'number') {
            this.priority = value;
        }

        return this;
    }

    /**
     * Convert this object to a json object.
     * @returns {{}}
     */
    toJSON()
    {
        let out = {};
        let skip = ['child', 'model','collection'];
        _.each(this, (value,key) => {
            if (skip.indexOf(key) > -1 || typeof value == 'function') return;
            out[key] = value;
        });
        return out;
    }
}

module.exports = Field;