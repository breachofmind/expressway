"use strict";

var Provider = require('./Provider');

class Driver extends Provider
{
    constructor(app)
    {
        super(app);

        this.order(0);
        this.requires(
            'LoggerProvider',
            'CoreProvider'
        );

        this.name = "Driver";
        this.Model = null;
    }
    /**
     * Should return the session store instance.
     * Examples: MongoStore, MySQLStore
     */
    getSessionStore() {
        throw new Error('getSessionStore method not implemented');
    }

    /**
     * Required for all drivers.
     * @param Class
     */
    setModelClass(Class) {
        this.Model = Class;
    }

    /**
     * Register the database class and provider with the application.
     * @param db {*}
     */
    register(db) {
        this.app.register('driverProvider', this, "The Driver Provider instance");
        this.app.register('db', db, "The database object, such as mongoose or sequelize");
    }
}

module.exports = Driver;