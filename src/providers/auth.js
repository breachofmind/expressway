"use strict";

var passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    crypto   = require('crypto'),
    mvc      = require('../../index');

/**
 * A helper class for authentication.
 * @param app Application
 * @constructor
 */
function Auth(app)
{
    var User = app.ModelFactory.object('User');

    /**
     * Encrypt a password with a salt.
     * @param password string
     * @param salt string
     * @returns {string}
     */
    this.encrypt = function(password, salt)
    {
        return crypto
            .createHmac("md5",salt)
            .update(password)
            .digest('hex');
    };

    /**
     * Serializes user from the user id.
     * @param user User model
     * @param done function
     */
    this.serializeUser = function(user,done)
    {
        done(null, user._id);
    };

    /**
     * Deserializes user from session.
     * @param id string
     * @param done function
     */
    this.deserializeUser = function(id,done)
    {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    };

    /**
     * Setup method for user authentication with passport.
     * @returns {Function}
     */
    this.bootstrap = function()
    {
        var strategy = new Strategy(function(username, password, done)
        {
            User.findOne({ email: username }, function (err, user) {

                app.logger.log('access', "Login attempt: '%s'", username);

                // If error, return with error.
                if (err) {
                    return done(err);
                }

                // If user is not found, fail with message.
                if (! user) {
                    app.logger.log('access', "User does not exist: '%s'", username);
                    return done(null, false, { message: 'auth.err_user_missing' });
                }

                // If user password is not valid, fail with message.
                if (! user.isValid(password)) {
                    app.logger.log('access', "Login attempt failed: '%s'", username);
                    return done(null, false, { message: 'auth.err_incorrect_password' });
                }


                app.logger.log('access', "Login successful: '%s' %s", username, user.id);

                return done(null, user);
            });
        });

        passport.serializeUser(this.serializeUser);

        passport.deserializeUser(this.deserializeUser);

        // Pass this function to the app bootstrap event.
        return function() {
            passport.use(strategy);
            app.express.use(passport.initialize());
            app.express.use(passport.session());
            app.passport = passport;
        }
    }
}

/**
 * Provides basic authentication with passport.
 * @author Mike Adamczyk <mike@bom.us>
 */
class AuthProvider extends mvc.Provider
{
    constructor()
    {
        super('auth');

        this.requires([
            'logger',
            'model',
            'express'
        ]);

    }

    register(app)
    {
        var Model = app.ModelFactory;

        if (! Model.has('User')) {
            throw ('User model is required to use basic Auth functionality.');
        }

        app.Auth = new Auth(app);

        app.event.on('application.bootstrap', app.Auth.bootstrap());

        // Attach the authenticated user to the view for use in templates.
        app.event.on('view.created', function(view,request){
            view.data.user = request.user;
        })
    }
}

module.exports = new AuthProvider();