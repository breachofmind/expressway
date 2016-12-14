"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var paths = app.get('paths');
var config = app.get('config');
var _ = require('lodash');

class Session extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides a session via express-session";
    }

    /**
     * Constructor
     */
    constructor()
    {
        super();

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
        }
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
     * @returns {Session}
     */
    dispatch()
    {
        let middleware = session(this.sessionOptions);

        return function Session(...args) {
            return middleware(...args);
        }
    }
}

module.exports = Session;

