var Field = require('expressway/src/Field');
var Sequelize = require('sequelize');

module.exports = {

    // TODO
    HasOne(model) {
        return function HasOne(field,collection) {
            return {
                type: Sequelize.INTEGER,
                ref: model
            }
        }
    },

    // TODO
    HasMany(model)
    {
        return function HasMany(field) {
            return {
                type: Array,
                child: new Field(field.name, field.collection).use(this.HasOne(model))
            }
        }
    },

    // TODO
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
            type: Sequelize.BOOLEAN,
            default: true
        }
    },

    String()
    {
        return {type: Sequelize.STRING};
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
        return {type: Sequelize.INTEGER}
    },

    Date()
    {
        return {type: Sequelize.DATEONLY}
    },

    Timestamp()
    {
        return {
            type: Sequelize.DATETIME,
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
        return {type:Sequelize.TEXT};
    },

    Slug()
    {
        return ['required','unique', this.String];
    }

};