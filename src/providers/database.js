"use strict";
var Provider     = require('../provider');
var mongoose     = require('mongoose');
mongoose.Promise = require('bluebird');

/**
 * Provides the MongoDB database connection.
 * @author Mike Adamczyk <mike@bom.us>
 */
class DatabaseProvider extends Provider
{
    constructor()
    {
        super('database');

        this.requires('logger');
    }

    register(app)
    {
        app.db = mongoose;

        app.db.connection.on('error', function(err){
            app.logger.error('[Database] Connection error: %s', err.message);
            process.exit(0);
        });

        app.db.connection.on('open', function(){
            app.logger.debug('[Database] Connected to MongoDB: %s', app.config.db);
            app.event.emit('database.connected', app);
        });

        app.event.on('application.destruct', function(){
            app.db.disconnect();
            app.logger.debug('[Database] Connection closed.');
        });

        app.db.connect(app.config.db);
    }
}

module.exports = new DatabaseProvider();