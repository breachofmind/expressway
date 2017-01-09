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
        this.ref        = null;
        this.label      = this.model.slug + "." + this.name + ".label";
        this.tip        = this.model.slug + "." + this.name + ".tip";
        this.default    = undefined;
        this.child      = null;
        this.order      = collection._counter;
    }

    get model()
    {
        return this.collection._model;
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
        }

        return this;
    }

    toJSON()
    {
        let out = {};
        ['name','typeName','label','tip','display','required','unique','ref','order','guarded','indexed'].forEach(property => {
            out[property] = this[property];
        });
        return out;
    }
}

module.exports = Field;