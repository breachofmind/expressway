"use strict";

var Expressway = require('expressway');
var mongoose   = require('mongoose');
var session    = require('express-session');
var Store      = require('connect-mongo')(session);
var Promise    = require('bluebird');

mongoose.Promise = Promise;

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.order(1);

        this.requires('LoggerProvider','ControllerProvider');

        this.events({
            'application.booted' : 'applicationBooted'
        });
    }


    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        app.singleton('modelService', require('../services/ModelService'), "Service for storing and retrieving models");

        app.register('db', mongoose, 'Mongoose ORM instance');
        app.register('ObjectId', mongoose.Types.ObjectId, 'MongoDB ObjectId constructor');
        app.register('ObjectIdType', mongoose.Schema.Types.ObjectId, 'MongoDB ObjectId Schema type');
        app.register('dataTypes', mongoose.Schema.Types, "Mongoose data types");

        app.call(this,'connect');

        // Expose the Model class.
        Expressway.Model = require('../Model');
    }

    /**
     * Connect to the database.
     * @param app Application
     * @param db mongoose
     * @param config function
     * @param debug function
     * @param log Winston
     */
    connect(app,db,config,debug,log)
    {
        let credentials = config('db');

        db.connection.on('error', (err) => {
            log.error('Connection error: %s on %s', err.message, credentials);
            process.exit(1);
        });

        db.connection.on('open', () => {
            debug(this,'Connected to MongoDB: %s', credentials);
            app.emit('database.connected', app);
        });

        db.connect(credentials);
    }

    /**
     * Fire when all providers are registered.
     * @param controllerService ControllerService
     */
    boot(controllerService)
    {
        // Switch out the file store and use mongo storage instead.
        if (controllerService.hasMiddleware('Session')) {
            controllerService.getMiddleware('Session').setStore(Store, {
                mongooseConnection: mongoose.connection
            });
        }
    }

    /**
     * When the application is done booting, boot the mongoose models.
     * @param modelService
     */
    applicationBooted(modelService)
    {
        modelService.boot();
    }
}

module.exports = ModelProvider;