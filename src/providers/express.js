"use strict";

var Provider = require('../provider'),
    core = require('../core'),
    express = require('express'),
    locale = require('locale'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    csrf = require('csurf'),
    MongoStore = require('connect-mongo')(session);

Provider.create('expressProvider', function() {

    this.order = 10;

    this.requires('viewProvider');

    return function(app)
    {
        var config = app.config;
        var utils = app.utils;

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
                app.express.use(locale(config.lang_support || ['en']));

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
                if (config.static_uri) {
                    express.static(config.static_uri)
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
            },

            /**
             * Sets up the session middleware.
             * @param app
             */
                function sessionMiddleware (app)
            {
                return session ({
                    secret: config.appKey,
                    saveUninitialized: false,
                    resave: false,
                    store: new MongoStore({
                        mongooseConnection: app.db.connection
                    })
                });
            },

            /**
             * Adds CSRF protection.
             * @param app
             */
                function CSRFMiddleware (app)
            {
                app.express.use(csrf());

                return function (err, request, response, next) {
                    if (err.code !== 'EBADCSRFTOKEN') {
                        return next();
                    }
                    return response.smart(response.view('error/403'), 403);
                };
            }
        ];

        function bootstrap(app)
        {
            app.express = express();

            app.express.set('view engine', config.view_engine || 'ejs');
            app.express.set('views', config.view_path || 'app/views');

            middleware.forEach(function(func)
            {
                app.logger.debug('[Express] Adding Application Middleware: %s', func.name);
                app._middlewares.push(func.name);
                var use = func(app);
                if (use) app.express.use(use);

            });
        }


        function server(app)
        {
            app.express.listen(config.port, function()
            {
                app.logger.info(`Starting %s server v.%s on %s (%s)...`,
                    app.env,
                    app.version,
                    config.url,
                    utils.url());
            });
        }

        app.event.on('application.bootstrap', bootstrap);

        app.event.on('application.server', server)
    }
});