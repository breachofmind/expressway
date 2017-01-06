"use strict";

var Field = require('expressway/src/SchemaBuilder').Field;

module.exports = function(app,SchemaTypes)
{
    return {
        One(model) {
            return function One() {
                return {
                    type: SchemaTypes.ObjectId, // TODO
                    ref: model
                }
            }
        },

        Many(model)
        {
            return function Many(field) {
                return {
                    type: Array,
                    child: new Field(field.name, field).use(this.One(model))
                }
            }
        },

        User() {
            return [
                'required',
                this.One('User')
            ]
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

        ArrayString(field)
        {
            return {
                type: Array,
                child: new Field(field.name, field).use(this.String)
            };
        },

        ArrayObject(field)
        {
            return {
                type: Array,
                child: new Field(field.name, field).use(this.Object)
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
                fillable: true,
                type: Date,
                default: Date.now,
            };
        },

        /**
         * Identifies the title.
         * @returns {[]}
         */
        Title()
        {
            return [
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
};