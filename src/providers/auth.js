"use strict";

var passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    crypto   = require('crypto'),
    expressway = require('expressway');


/**
 * Provides basic authentication with passport.
 * @author Mike Adamczyk <mike@bom.us>
 */
class AuthProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.requires = [
            'ORMProvider',
            "LoggerProvider",
            "ExpressProvider"
        ];

        this.inject = [
            'ORM',
            'ExpressProvider',
            'events'
        ];
    }

    /**
     * Register with express.
     * @param app
     * @param ORM
     * @param ExpressProvider
     * @param event EventEmitter
     */
    register(app, ORM, ExpressProvider,event)
    {
        if (! ORM.has('User')) {
            throw ('User model is required to use basic Auth functionality.');
        }

        var Auth = app.call(this,'getAuthClass', [app,'log','express','Models']);

        var auth = new Auth(passport);

        ExpressProvider.middleware(auth.middleware);

        // Attach the authenticated user to the view for use in templates.
        event.on('view.created', function(view,request){
            view.data.user = request.user;
        });

        app.register('encrypt', this.encrypt);
    }


    /**
     * Return the Auth class.
     * @param app Application
     * @param logger Winston
     * @param express Express
     * @param Models object
     * @returns {Auth}
     */
    getAuthClass(app,logger,express,Models)
    {
        var User = Models.User;

        return class Auth
        {
            constructor(passport)
            {
                this.passport = passport;
                this.passport.serializeUser(this.serializeUser);
                this.passport.deserializeUser(this.deserializeUser);

                this.strategy = new Strategy(function(username, password, done)
                {
                    logger.log('access', "Login attempt: '%s'", username);

                    this.getUser(username).then(function(user)
                    {
                        // If user is not found, fail with message.
                        if (! user) {
                            logger.log('access', "User does not exist: '%s'", username);
                            return done(null, false, { message: 'auth.err_user_missing' });
                        }

                        // If user password is not valid, fail with message.
                        if (! user.isValid(password)) {
                            logger.log('access', "Login attempt failed: '%s'", username);
                            return done(null, false, { message: 'auth.err_incorrect_password' });
                        }

                        // If they got this far, they were successfully authenticated.
                        logger.log('access', "Login successful: '%s' %s", username, user.id);

                        return done(null, user);

                    }, function(err) {

                        // There was an error, probably database related...
                        return done(err);
                    });

                }.bind(this));

                app.register('passport', this.passport);
                app.register('Auth', this);
            }

            /**
             * Middleware to return to Express.
             * @returns {function}
             */
            get middleware()
            {
                var auth = this;

                // Pass this function to the app bootstrap event.
                return function passportMiddleware(app)
                {
                    auth.passport.use(auth.strategy);
                    express.use(auth.passport.initialize());
                    express.use(auth.passport.session());
                }
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
                User.model.findById(id).populate(User.populate).exec(function(err, user) {
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
                return User.findOne({ email: username }).populate(User.populate).exec();
            }
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
        return crypto
            .createHmac("md5",salt)
            .update(password)
            .digest('hex');
    };
}

module.exports = new AuthProvider();