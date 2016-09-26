"use strict";
var Sequelize = require('sequelize');

module.exports = function MysqlDriver (app, Model)
{
    var db = new Sequelize(app.config.db, {});

    app.db = db;

    /**
     * The mysql Model class.
     * Uses the sequelize ORM api.
     */
    class MysqlModel extends Model
    {
        constructor(app) {
            super(app);

            this.Sequelize = Sequelize;
        }

        get(args) {
            //
        }

        find(args) {
            //
        }

        findById(id) {
            //
        }

        /**
         * Get the schema.
         * @returns {*}
         */
        get schema()
        {
            return this._schema;
        }

        /**
         * Set the schema.
         * @param object
         */
        set schema(object)
        {
            this._schema = object;
        }

        /**
         * Sets up the toJSON method.
         * @private
         */
        _setToJSON()
        {
            //
        }
        /**
         * When booting, create the database model for mongoose.
         * @returns boolean
         */
        boot()
        {
            this._setToJSON();

            this._model = db.define(this.name.toLowerCase(), this.schema, {
                instanceMethods: this.methods
            });

            return super.boot();
        }
    }

    return MongoModel;
};