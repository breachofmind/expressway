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
            'LoggerProvider',
            'ControllerProvider',
        ];
    }

    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        // Attach the authenticated user to the view for use in templates.
        app.on('view.created', (view,request) => {
            view.data.user = request.user;
        });

        app.register('encrypt', this.encrypt, "Function for encrypting passwords securely");

        app.register('AuthController', require('../controllers/AuthController'), "Default user authentication controller");
    }


    /**
     * Boot after all providers have been loaded.
     * @param modelService ModelService
     */
    boot(modelService)
    {
        if (! modelService.has('User')) {
            throw ('"User" model is required to use basic Auth functionality.');
        }
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