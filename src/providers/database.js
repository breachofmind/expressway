"use strict";

var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

/**
 * Provides the MongoDB database connection.
 * @author Mike Adamczyk <mike@bom.us>
 * @param Provider
 */
module.exports = function(Provider)
{
    Provider.create('databaseProvider', function() {

        this.requires('loggerProvider');

        return function(app)
        {
            app.db = mongoose;

            app.db.connection.on('error', function(err){
                app.logger.error('[Database] Connection error: %s', err);
            });

            app.db.connection.on('open', function(){
                app.logger.debug('[Database] Connected to MongoDB: %s', app.config.db);
            });

            app.db.connect(app.config.db);
        }
    });
};
