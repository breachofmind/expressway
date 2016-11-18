"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var [User,log] = app.get('User','log');

class BasicAuth extends Expressway.Middleware
{
    constructor()
    {
        super();

        passport.use(new Strategy(this.strategy));
        passport.serializeUser(this.serialize);
        passport.deserializeUser(this.deserialize);

        app.register('passport', passport, "The passport instance");
    }

    dispatch()
    {
        return [
            function PassportInitialize(...args) {
                return passport.initialize()(...args);
            },
            function PassportSession(...args) {
                return passport.session()(...args);
            }
        ]
    }

    /**
     * The local strategy to use for authentication.
     * @param username string
     * @param password string
     * @param done Function
     */
    strategy(username,password,done)
    {
        log.access("Login attempt: '%s'", username);

        User.findOne({ email: username }).populate(User.populate).exec().then( user =>
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

    /**
     * Serializes user from the user id.
     * @param user User model
     * @param done function
     */
    serialize(user,done)
    {
        done(null, user._id);
    }

    /**
     * Deserializes user from session.
     * @param id string
     * @param done function
     */
    deserialize(id,done)
    {
        User.findById(id).populate(User.populate).exec().then(user => {
            done(null, user);
        }, err => {
            done(err,null);
        });
    }
}

module.exports = BasicAuth;