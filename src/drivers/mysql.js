"use strict";

var Sequelize = require('sequelize');
var expressway = require('expressway');

class MysqlDriver
{
    constructor()
    {
        this.name = this.constructor.name;
        this.Model = null;
    }

    /**
     * Register the driver with the application.
     * @param app Application
     * @returns {MysqlModel}
     */
    register(app)
    {
        var db = new Sequelize(app.config.db, {
            timestamps: false,
            underscored: true,
        });

        app.register('db', db);

        return this.Model = app.call(this,'getModelClass', [app,'db','BaseModel']);
    }

    /**
     * Return the extended Model class.
     * @param app Application
     * @param db Mongoose
     * @param BaseModel BaseModel
     * @returns {MysqlModel}
     */
    getModelClass(app,db,BaseModel)
    {
        return class MysqlModel extends BaseModel
        {
            /**
             * Model constructor.
             * @param app
             */
            constructor(app)
            {
                super(app);

                this.Sequelize = Sequelize;
                this.PRIMARY_KEY = {type:Sequelize.INTEGER, unique:true, primaryKey:true, authIncrement:true}
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
                    instanceMethods: this.methods,
                    tableName: this.table || this.name.toLowerCase()
                });

                this._model.sync();

                return super.boot();
            }
        }
    }
}

module.exports = new MysqlDriver();
