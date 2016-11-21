"use strict";

var Expressway = require('expressway');
var session    = require('express-session');
var Promise    = require('bluebird');

class MongoDriverProvider extends Expressway.Driver
{
    get alias() { return "mongodb" }

    /**
     * Register the driver with the application.
     * @param app Application
     * @param debug function
     * @param log Winston
     * @param config function
     */
    register(app,debug,log,config)
    {
        var db = require('mongoose');

        db.Promise = Promise;

        db.connection.on('error', function(err){
            log.error('Connection error: %s on %s', err.message, config('db'));
            process.exit(1);
        });

        db.connection.on('open', function(){
            debug('MongoDriverProvider','Connected to MongoDB: %s', config('db'));
            app.emit('database.connected', app);
        });

        db.connect(config('db'));

        super.register(db);

        // Register a commonly used type.
        app.register('ObjectId', db.Types.ObjectId, 'MongoDB ObjectId constructor');
        app.register('ObjectIdType', db.Schema.Types.ObjectId, 'MongoDB ObjectId Schema type');

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