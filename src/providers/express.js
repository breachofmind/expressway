"use strict";

var core         = require('../core'),
    express      = require('express'),
    locale       = require('locale'),
    bodyParser   = require('body-parser'),
    session      = require('express-session'),
    csrf         = require('csurf'),
    flash        = require('connect-flash'),
    cookieParser = require('cookie-parser'),
    Provider     = require('../provider'),
    MongoStore   = require('connect-mongo')(session);

/**
 * Provides the express server and core middleware.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ExpressProvider extends Provider
{
    constructor()
    {
        super('express');

        this.order = 10;
        this.requires('view');
    }

    register(app)
    {
        var config = app.config;

        app._middlewares = [];

        var middleware = [
            /**
             * The core middleware.
             * @param app
             */
            function coreMiddleware(app)
            {
                return core(app);
            },

            /**
             * Checks if the request originated
             * from an ajax request.
             * @param app
             */
            function ajaxMiddleware(app)
            {
                return function(request,response,next)
                {
                    request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
                    next();
                }
            },

            /**
             * Adds localization support.
             * @param app
             */
            function localeMiddleware (app)
            {
                app.express.use(locale(app.conf('lang_support', ['en_US'])));

                return function (request,response,next)
                {
                    if (request.query.cc) {
                        request.locale = request.query.cc.toLowerCase();
                    }
                    next();
                }
            },

            /**
             * Serves static content, if configured.
             * @param app
             */
            function staticContentMiddleware (app)
            {
                if (app.conf('static_path')) {
                    app.logger.debug('[Express] Using static path: %s', app.path('static_path'));
                    express.static(app.path('static_path'));
                }
            },

            /**
             * Parses the body response.
             * @param app
             */
            function bodyParserMiddleware(app)
            {
                app.express.use(bodyParser.json());
                app.express.use(bodyParser.urlencoded({extended:true}));
                app.express.use(cookieParser(app.conf('appKey', "keyboard cat")));
            },

            /**
             * Sets up the session middleware.
             * @param app
             */
            function sessionMiddleware (app)
            {
                return session ({
                    secret: app.conf('appKey', 'keyboard cat'),
                    saveUninitialized: false,
                    resave: false,
                    store: new MongoStore({
                        mongooseConnection: app.db.connection
                    })
                });
            },

            /**
             * Adds flash message support.
             * @param app
             */
            function flashMiddleware(app)
            {
                app.express.use(flash());
            }
        ];

        /**
         * Called before the server starts.
         * @param app Application
         */
        function bootstrap(app)
        {
            app.express = express();

            app.express.set('view engine', app.conf('view_engine', 'ejs'));
            app.express.set('views', app.rootPath(app.conf('views_path', 'resources/views')));

            // Install the default middleware.
            middleware.forEach(function(func)
            {
                app.logger.debug('[Express] Adding Application Middleware: %s', func.name);
                app._middlewares.push(func.name);
                var use = func(app);
                if (use) app.express.use(use);

            });
        }

        /**
         * Called when the server is ready to start.
         * @param app Application
         */
        function server(app)
        {
            app.express.listen(config.port, function()
            {
                app.logger.info('[Express] Using root path: %s', app.rootPath());
                app.logger.info(`[Express] Starting %s server v.%s on %s (%s)...`,
                    app.env,
                    app.version,
                    app.conf('url'),
                    app.url());

                app.event.emit('express.listening', app.express);
            });
        }

        app.event.on('application.bootstrap', bootstrap);

        app.event.on('application.server', server)
    }
}

module.exports = new ExpressProvider();