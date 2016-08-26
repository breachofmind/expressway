"use strict";

var passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    crypto   = require('crypto'),
    mvc      = require('../../index');

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

        if (! Model.get('user')) {
            throw ('User model is required to use basic Auth functionality.');
        }

        /**
         * A helper class for authentication.
         * @constructor
         */
        class Auth {
            /**
             * Encrypt a password with a salt.
             * @param password string
             * @param salt string
             * @returns {string}
             */
            static encrypt(password,salt)
            {
                return crypto
                    .createHmac("md5",salt)
                    .update(password)
                    .digest('hex');
            };
        }

        /**
         * When express is loaded, attach the middleware.
         * @param app
         */
        function bootstrap(app)
        {
            app.express.use(passport.initialize());
            app.express.use(passport.session());

            passport.serializeUser(function(user, done)
            {
                done(null, user._id);
            });

            passport.deserializeUser(function(id, done)
            {
                Model.User.findById(id, function(err, user) {
                    done(err, user);
                });
            });


            passport.use(new Strategy(function(username,password,done)
            {
                Model.User.findOne({ email: username }, function (err, user) {

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
            }));

            app.passport = passport;
        }

        app.Auth = Auth;

        app.event.on('application.bootstrap', bootstrap);

        app.event.on('view.created', function(view,request){
            view.data.user = request.user;
        })
    }
}

module.exports = new AuthProvider();