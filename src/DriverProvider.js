"use strict";

var Provider = require('./Provider');

class DriverProvider extends Provider
{
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'URLProvider'
        ];

        this.name = "DriverProvider";

        this.order = 0;
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
        this.app.register(this.name, this);
        this.app.register('db', db);
    }
}

module.exports = DriverProvider;