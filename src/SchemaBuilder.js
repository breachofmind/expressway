"use strict";

var isArray = Array.isArray;
var _ = require('lodash');
var EventEmitter = require('events');

class SchemaBuilder extends EventEmitter
{
    constructor(app,model)
    {
        super();

        this._app = app;
        this._fields = {};
        this._model = model;
        this._counter = 0;
        this._types = app.get('FieldTypes');
    }

    /**
     * Return the protected Application instance.
     * @returns {Application}
     */
    get app()
    {
        return this._app;
    }

    /**
     * Return the protected fields index.
     * @returns {{}}
     */
    get fields()
    {
        return this._fields;
    }

    get types()
    {
        return this._types;
    }

    /**
     * Create a new field.
     * @param name string
     * @param args *
     * @returns {SchemaBuilder}
     */
    field(name,...args)
    {
        let field = new Field(name,this).use(args);
        this._fields[field.name] = field;

        return this;
    }

    /**
     * Alias of field()
     * @alias
     * @param name
     * @param args
     * @returns {SchemaBuilder}
     */
    $(name,...args)
    {
        return this.field(name,args);
    }

    /**
     * Add timestamps.
     * @returns {SchemaBuilder}
     */
    timestamps()
    {
        return this
            .field('created_at', this.types.Timestamp)
            .field('modified_at', this.types.Timestamp);
    }

    /**
     * Create a slug field.
     * @returns {SchemaBuilder}
     */
    slug()
    {
        return this.field('slug', this.types.Slug);
    }

    /**
     * Create the schema.
     * @returns {{}}
     */
    toJSON()
    {
        let out = {};
        _.each(this._fields, (field,name) => {
            out[name] = field.schema();
        });
        return out;
    }

    /**
     * List the field properties.
     * @returns {{}}
     */
    properties()
    {
        let out = {};
        _.each(this._fields, (field,name) => {
            out[name] = field.properties();
        });
        return out;
    }

    /**
     * Return an array of field names.
     * @returns {Array}
     */
    fieldNames()
    {
        return _.map(this._fields, (field,name) => { return field.name });
    }
}


/**
 * Field class.
 */
class Field
{
    constructor(name, parent)
    {
        this.parent     = parent;
        this.name       = name;
        this.type       = null;
        this.typeName   = null;
        this.required   = false;
        this.unique     = false;
        this.display    = false;
        this.ref        = null;
        this.label      = this.model.slug + "." + this.name + ".label";
        this.tip        = this.model.slug + "." + this.name + ".tip";
        this.default    = undefined;
        this.child      = null;
        this.order      = this.builder._counter;

        this.builder._counter ++;
    }

    get model()
    {
        return this.builder._model;
    }

    get builder()
    {
        return this.parent instanceof SchemaBuilder
            ? this.parent
            : this.parent.builder;
    }

    /**
     * Modify this field's properties.
     * @param value {String|Function|Array|Object}
     * @returns {Field}
     */
    use(value)
    {
        if (! value) return this;

        if(isArray(value)) {
            value.forEach(item => { this.use(item) });
            return this;
        }
        if (typeof value == 'function') {
            if (value.name) this.typeName = value.name;
            return this.use( value.apply(this.builder.types, [this, this.builder]) );
        } else if (typeof value == 'object') {
            _.assign(this,value);
        } else if (typeof value == 'string' && this.hasOwnProperty(value) && typeof this[value] == 'boolean') {
            this[value] = true;
        }

        return this;
    }

    /**
     * Get the schema to pass to mongoose.
     * @returns {[]|{}}
     */
    schema()
    {
        if (this.child) {
            return [ this.child.schema() ];
        }
        let out = {type: this.type};
        _.each(['unique','required'], property => {
            if (this[property] === true) out[property] = this[property];
        });
        if (this.default !== undefined) out['default'] = this.default;
        if (typeof this.ref == 'string') out.ref = this.ref;

        return out;
    }

    properties()
    {
        let out = {};
        ['name','typeName','label','tip','display','required','unique','ref','order'].forEach(property => {
            out[property] = this[property];
        });
        return out;
    }
}

SchemaBuilder.Field = Field;

module.exports = SchemaBuilder;