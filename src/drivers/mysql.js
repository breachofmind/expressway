"use strict";

var Expressway = require('expressway');
var Sequelize = require('sequelize');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

class MySQLDriver extends Expressway.Driver
{
    /**
     * Register the driver with the application.
     * @param app Application
     * @returns {MysqlModel}
     */
    register(app)
    {
        var db = new Sequelize(this.app.config.db, {
            timestamps: false,
            underscored: true,
        });

        app.register('db', db);
    }

    /**
     * Get the session storage solution.
     * @returns MySQLStore
     */
    getSessionStore()
    {
        var db = this.app.get('db');
        return new MySQLStore({}, db.connection);
    }
}

/**
 * MySQL model class.
 */
class MySQLModel extends Expressway.BaseModel
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


module.exports = new MySQLDriver(app, MySQLModel);
