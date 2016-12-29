"use strict";

var Expressway = require('expressway');
var mongoose   = require('mongoose');
var session    = require('express-session');
var Store      = require('connect-mongo')(session);
var Promise    = require('bluebird');
var _          = require('lodash');

mongoose.Promise = Promise;

const CRUD = ['create','read','update','delete'];

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     * @param utils Object
     */
    constructor(app,utils)
    {
        super(app);

        this.order = 1;

        app.service('db', mongoose);
        app.service('ObjectId', mongoose.Types.ObjectId);
        app.service('ObjectIdType', mongoose.Schema.Types.ObjectId);
        app.service('SchemaTypes', mongoose.Schema.Types.ObjectId);
        app.service('seeder', app.load('expressway/src/services/SeederService'));

        /**
         * A helper function for creating permissions.
         * @param modelNames {String|Array}
         * @param actions {Array} - defaults to [create,read,update,delete]
         * @returns {Array}
         */
        function permissions(modelNames, actions=CRUD)
        {
            let models = utils.castToArray(modelNames);
            return utils.compound (models.map(modelName => {
                return actions.map(action => {
                    return `${modelName}.${action}`;
                })
            }));
        }

        permissions.CRUD = CRUD;

        app.service(permissions);
    }

    /**
     * When the app boots, connect to the database.
     * @param app
     * @param db
     * @param config
     * @param log
     * @param debug
     */
    boot(app,db,config,log,debug)
    {
        let credentials = config('db');

        db.connection.on('error', (err) => {
            log.error('ModelProvider connection error: %s on %s', err.message, credentials);
            process.exit(1);
        });

        db.connection.on('open', () => {
            debug('ModelProvider connected to MongoDB: %s', credentials);
            app.emit('database.connected');
        });

        db.connect(credentials);

        if (app.middleware.has('Session')) {
            app.middleware.get('Session').setStore(Store, {
                mongooseConnection: db.connection
            })
        }
    }
}

module.exports = ModelProvider;