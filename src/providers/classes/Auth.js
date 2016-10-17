"use strict";

var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var Expressway = require('expressway');
var app = Expressway.instance.app;
var Models = app.get('Models');

/**
 * Authentication class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Auth
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        app.register('auth', this, "The Auth instance");
        app.register('passport', passport, "The passport instance");

        this.passport = passport;

        passport.serializeUser(this.serializeUser);
        passport.deserializeUser(this.deserializeUser);

        this.strategy = new Strategy(app.call(this,'getStrategyMethod'));


    }

    /**
     * Get the strategy callback.
     * @param app Application
     * @param auth Auth
     * @param log Winston
     * @returns {Function}
     */
    getStrategyMethod(app,auth,log)
    {
        /**
         * The strategy callback.
         * @param username string
         * @param password string
         * @param done function
         */
        return function(username, password, done)
        {
            log.access("Login attempt: '%s'", username);

            auth.getUser(username).then(function(user)
            {
                // If user is not found, fail with message.
                if (! user) {
                    log.access("User does not exist: '%s'", username);
                    return done(null, false, { message: 'auth.err_user_missing' });
                }

                try {
                    user.authenicate(password);
                } catch(err) {
                    log.access("Login attempt failed: '%s'", username);
                    return done(null, false, { message: 'auth.err_'+err });
                }

                // If they got this far, they were successfully authenticated.
                log.access("Login successful: '%s' %s", username, user.id);

                return done(null, user);

            }, function(err) {

                // There was an error, probably database related...
                return done(err);
            });
        }




    }


    /**
     * Middleware to return to Express.
     */
    middleware(server)
    {
        this.passport.use(this.strategy);
        server.use(this.passport.initialize());
        server.use(this.passport.session());
    }


    /**
     * Serializes user from the user id.
     * @param user User model
     * @param done function
     */
    serializeUser(user,done)
    {
        done(null, user._id);
    };

    /**
     * Deserializes user from session.
     * @param id string
     * @param done function
     */
    deserializeUser(id,done)
    {
        Models.User
            .findById(id)
            .populate(Models.User.populate)
            .exec()
            .then(user => {
                done(null, user);
            }, err => {
                done(err,null);
            });
    };

    /**
     * Get a user by username (email).
     * @param username string
     * @returns {Promise}
     */
    getUser(username)
    {
        return Models.User
            .findOne({ email: username })
            .populate(Models.User.populate)
            .exec();
    }
}

module.exports = Auth;