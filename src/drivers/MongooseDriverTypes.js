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
            this.Text,
            {typeName: "Email"}
        ];
    },


    Boolean()
    {
        return {
            type: Boolean,
            default: true
        }
    },

    Text()
    {
        return {type: String};
    },

    StringArray(field)
    {
        return {
            type: Array,
            child: new Field(field.name, field.collection).use(this.Text)
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
    Password() {
        return [
            'required',
            'fillable',
            'guarded',
            this.Text,
            {typeName: "Password"}
        ]
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

        return [
            this.Text,
            {typeName:"URL"}
        ]
    },

    /**
     * Identifies the title.
     * @returns {[]}
     */
    Title()
    {
        return [
            -1,
            'indexed',
            'display',
            'required',
            'fillable',
            this.Text,
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
        return [
            'required',
            'unique',
            'fillable',
            this.Text
        ];
    }

};