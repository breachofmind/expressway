"use strict";

var Expressway = require('expressway');
var session = require('express-session');

class MySQLDriverProvider extends Expressway.DriverProvider
{
    get alias() { return "mysql" }

    /**
     * Register the driver with the application.
     * @param app Application
     * @param debug function
     * @param config function
     */
    register(debug,config)
    {
        var Sequelize = require('sequelize');

        var db = new Sequelize(config('db'), {
            timestamps: false,
            underscored: true,
        });

        debug('MySQLDriverProvider','Connected to MySQL: %s', config('db'));

        super.register(db);

        this.setModelClass( require('../drivers/MySQLModel') );
    }

    /**
     * Return the session storage solution.
     * @returns {MySQLStore}
     */
    getSessionStore(db)
    {
        var MySQLStore = require('express-mysql-session')(session);
        return new MySQLStore({}, db.connection);
    }
}

module.exports = MySQLDriverProvider;