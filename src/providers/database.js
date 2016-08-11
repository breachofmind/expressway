"use strict";

var Provider = require('../provider');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

Provider.create('databaseProvider', function() {

    this.requires('loggerProvider');

    return function(app)
    {
        app.db = mongoose;

        app.db.connect(app.config.db);

        app.logger.debug('[Database] Connected to MongoDB: %s', app.config.db);
    }
});