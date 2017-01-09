var Field = require('expressway/src/Field');
var SchemaTypes = require('mongoose').Schema.Types;

module.exports = {

    HasOne(model) {
        return function HasOne() {
            return {
                type: SchemaTypes.ObjectId,
                ref: model
            }
        }
    },

    HasMany(model)
    {
        return function HasMany(field) {
            return {
                type: Array,
                child: new Field(field.name, field.collection).use(this.HasOne(model))
            }
        }
    },

    User() {
        return [
            'required',
            this.HasOne('User')
        ]
    },

    Email() {
        return [
            'indexed',
            'required',
            this.String
        ];
    },


    Boolean()
    {
        return {
            type: Boolean,
            default: true
        }
    },

    String()
    {
        return {type: String};
    },

    StringArray(field)
    {
        return {
            type: Array,
            child: new Field(field.name, field.collection).use(this.String)
        };
    },

    ObjectArray(field)
    {
        return {
            type: Array,
            child: new Field(field.name, field.collection).use(this.Object)
        };
    },

    Object()
    {
        return {type: Object}
    },

    Number()
    {
        return {type: Number}
    },

    Date()
    {
        return {type: Date}
    },

    Timestamp()
    {
        return {
            type: Date,
            default: Date.now,
        };
    },

    URL() {
        // TODO, also add validators
        return this.String
    },

    /**
     * Identifies the title.
     * @returns {[]}
     */
    Title()
    {
        return [
            'indexed',
            'display',
            'required',
            {order: -1},
            this.String,
        ];
    },

    /**
     * A mixed schema type.
     * @returns {{type: *}}
     */
    Mixed() {
        return {type:SchemaTypes.Mixed};
    },

    Slug()
    {
        return ['required','unique', this.String];
    }

};