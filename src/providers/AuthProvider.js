"use strict";

var crypto   = require('crypto');
var Expressway = require('expressway');
var Auth = require('./classes/Auth');

/**
 * Provides basic authentication with passport.
 * @author Mike Adamczyk <mike@bom.us>
 */
class AuthProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'ModelProvider',
            "LoggerProvider",
            "ExpressProvider"
        ];
    }

    /**
     * Register with express.
     * @param ModelProvider ModelProvider
     * @param ExpressProvider ExpressProvider
     * @param event EventEmitter
     */
    register(ModelProvider, ExpressProvider, event)
    {
        if (! ModelProvider.hasModel('User')) {
            throw ('"User" model is required to use basic Auth functionality.');
        }
        var auth = this.app.call(Auth);

        ExpressProvider.middlewareStack.add('Basic Authentication', function(app,server) {
            auth.middleware(server);
        });

        // Attach the authenticated user to the view for use in templates.
        event.on('view.created', function(view,request){
            view.data.user = request.user;
        });

        this.app.register('encrypt', this.encrypt);
    }

    /**
     * Encrypt a password with a salt.
     * @param password string
     * @param salt string
     * @returns {string}
     */
    encrypt(password, salt)
    {
        return crypto.createHmac("md5",salt).update(password).digest('hex');
    };
}

module.exports = AuthProvider;