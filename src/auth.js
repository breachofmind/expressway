"use strict";

var passport    = require('passport'),
    Strategy    = require('passport-local').Strategy,
    crypto      = require('crypto');

var Model = require('./model');

/**
 * Set up the authentication middleware.
 * @param app Application
 */
var Auth = function(app)
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

            app.logger.warn(`[%s] Login attempt by ${username}`, new Date());

            // If error, return with error.
            if (err) {
                return done(err);
            }

            // If user is not found, fail with message.
            if (! user) {
                return done(null, false, { message: 'User does not exist.' });
            }

            // If user password is not valid, fail with message.
            if (! user.isValid(password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            app.logger.warn(`[%s] Login successful by ${username}`, new Date());
            return done(null, user);
        });
    }));

    app.passport = passport;
};

/**
 * Encrypt a password with a salt.
 * @param password string
 * @param salt string
 * @returns {string}
 */
Auth.encrypt = function(password,salt)
{
    return crypto
        .createHmac("md5",salt)
        .update(password)
        .digest('hex');
};



module.exports = Auth;