"use strict";

var crypto   = require('crypto');
var Expressway = require('expressway');

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
     * @param app Application
     * @param ModelProvider ModelProvider
     * @param ExpressProvider ExpressProvider
     * @param event EventEmitter
     */
    register(app, ModelProvider, ExpressProvider, event)
    {
        event.once('providers.registered', app => {

            if (! ModelProvider.hasModel('User')) {
                throw ('"User" model is required to use basic Auth functionality.');
            }

            var Auth = require('./classes/Auth');

            var auth = app.call(Auth);

            ExpressProvider.middlewareStack.add('Basic Authentication', function(app,server) {
                auth.middleware(server);
            });
        });


        // Attach the authenticated user to the view for use in templates.
        event.on('view.created', (view,request) => {
            view.data.user = request.user;
        });

        app.register('encrypt', this.encrypt, "Function for encrypting passwords securely");
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