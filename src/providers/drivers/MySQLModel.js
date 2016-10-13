"use strict";

var Expressway  = require('expressway');
var Sequelize   = require('Sequelize');
var app         = Expressway.instance.app;
var db          = app.get('db');
var driver      = app.get('DriverProvider');

Sequelize.PRIMARY_KEY = {type:Sequelize.INTEGER, unique:true, primaryKey:true, authIncrement:true};

/**
 * MySQL model class.
 * @author Mike Adamczyk <mike@bom.us>
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

        /**
         * The main Sequelize class,
         * which the developer will need!
         */
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
     * When booting, create the database model for mongoose.
     * @returns boolean
     */
    boot()
    {
        this.model = db.define(this.name, this.schema, {
            instanceMethods: this.methods,
            tableName: this.table
        });

        // Sync up the database tables.
        this.model.sync();

        return super.boot();
    }
}

module.exports = MySQLModel;