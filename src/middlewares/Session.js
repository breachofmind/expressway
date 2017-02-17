"use strict";

var Middleware = require('../Middleware');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var _ = require('lodash');

class Session extends Middleware
{
    get description() {
        return "Provides a session via express-session";
    }

    /**
     * Constructor
     * @param app Application
     * @param config Function
     * @param paths PathService
     */
    constructor(app,config,paths)
    {
        super(app);

        // Default session options.
        this.options = {
            secret: config('appKey', 'keyboard cat'),
            saveUninitialized: false,
            resave: false,
        };

        // A simple file store is used if nothing provided.
        this.store = FileStore;
        this.storeOptions = {
            path: paths.tmp('sessions'),
        };

        app.on('database.boot', (db,MongoStore) => {
            this.setStore(MongoStore, {
                mongooseConnection: db.connection
            })
        });

    }

    /**
     * Set a different store.
     * @param func Function
     * @param options object
     */
    setStore(func,options={})
    {
        this.store = func;
        this.storeOptions = options;
    }

    /**
     * Returns an object to pass to session().
     * @returns object
     */
    get sessionOptions()
    {
        let Store = this.store;
        return _.assign({}, this.options, {store: new Store(this.storeOptions)});
    }

    /**
     * Dispatch the middleware function to express.
     * @param extension Extension
     * @returns {Session}
     */
    dispatch(extension,debug)
    {
        debug('Session using store: %s -> %s', extension.name, this.store.name);

        let middleware = session(this.sessionOptions);

        return function Session(...args) {
            return middleware(...args);
        }
    }
}

module.exports = Session;

