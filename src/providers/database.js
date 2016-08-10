"use strict";

var Provider = require('../provider');

var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

Provider.create('databaseProvider', function(app) {

    this.requires('loggerProvider');

    app.db = mongoose;

    app.db.connect(app.config.db);

    app.logger.debug('Connected to Database: %s', app.config.db);
});