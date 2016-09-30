"use strict";

var passport = require('passport');
var Strategy = require('passport-local').Strategy;

/**
 * Authentication class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Auth
{
    /**
     * Constructor.
     * @param app Application
     * @param log Winston
     * @param User Model
     */
    constructor(app, User)
    {
        this.passport = passport;
        this.User     = User;
        this.log      = app.get('log');

        passport.serializeUser(this.serializeUser);
        passport.deserializeUser(this.deserializeUser);

        this.strategy = new Strategy(this.getStrategyMethod);

        app.register('auth', this);
        app.register('passport', passport);

    }

    /**
     * The strategy callback.
     * @param username string
     * @param password string
     * @param done function
     */
    getStrategyMethod(username, password, done)
    {
        var auth = this;

        this.log('access', "Login attempt: '%s'", username);

        this.getUser(username).then(function(user)
        {
            // If user is not found, fail with message.
            if (! user) {
                auth.log('access', "User does not exist: '%s'", username);
                return done(null, false, { message: 'auth.err_user_missing' });
            }

            // If user password is not valid, fail with message.
            if (! user.isValid(password)) {
                auth.log('access', "Login attempt failed: '%s'", username);
                return done(null, false, { message: 'auth.err_incorrect_password' });
            }

            // If they got this far, they were successfully authenticated.
            auth.log('access', "Login successful: '%s' %s", username, user.id);

            return done(null, user);

        }, function(err) {

            // There was an error, probably database related...
            return done(err);
        });
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
        this.User
            .findById(id)
            .populate(this.User.populate)
            .exec()
            .then(function(err, user) {
                done(err, user);
            });
    };

    /**
     * Get a user by username (email).
     * @param username string
     * @returns {Promise}
     */
    getUser(username)
    {
        return this.User
            .findOne({ email: username })
            .populate(this.User.populate)
            .exec();
    }
}

module.exports = Auth;