"use strict";

var Expressway = require('expressway');
var session    = require('express-session');

class MongoDriverProvider extends Expressway.DriverProvider
{
    get alias() { return "mongodb" }

    /**
     * Register the driver with the application.
     * @param app Application
     * @param debug function
     * @param log Winston
     * @param event EventEmitter
     */
    register(app,debug,log,event)
    {
        var db     = require('mongoose');
        db.Promise = require('bluebird');

        db.connection.on('error', function(err){
            log.error('Connection error: %s on %s', err.message, app.config.db);
            process.exit(0);
        });

        db.connection.on('open', function(){
            debug('MongoDriverProvider','Connected to MongoDB: %s', app.config.db);
            event.emit('database.connected', app);
        });

        event.on('application.destruct', function(){
            db.disconnect();
            debug('MongoDriverProvider','Connection closed');
        });

        db.connect(app.config.db);

        super.register(db);

        this.setModelClass( require('../drivers/MongoModel') );
    }

    /**
     * Return the session storage solution.
     * @returns {MongoStore}
     */
    getSessionStore(db)
    {
        var MongoStore = require('connect-mongo')(session);
        return new MongoStore({
            mongooseConnection: db.connection
        })
    }
}

module.exports = MongoDriverProvider;