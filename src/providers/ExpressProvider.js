"use strict";

var Express         = require('express');
var locale          = require('locale');
var bodyParser      = require('body-parser');
var session         = require('express-session');
var flash           = require('connect-flash');
var cookieParser    = require('cookie-parser');
var Expressway      = require('expressway');

/**
 * Provides the express server and core middleware.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ExpressProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.order = 10;

        this.requires = [
            'LoggerProvider',
            'ViewProvider',
            'CoreProvider'
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        var MiddlewareService = require('../services/MiddlewareService');

        var middleware = new MiddlewareService;

        app.register('middlewareService', middleware, "For storing and retrieving global express middleware");

        app.register('express', Express(), "The express instance");

        app.call(this,'setDefaultMiddleware');

        event.on('application.bootstrap', app.call(this,'onBootstrap'));

        event.on('application.server', app.call(this,'onServerStart'))
    }

    /**
     * Set up the default middleware for express.
     * @param middlewareService MiddlewareService
     * @param debug function
     */
    setDefaultMiddleware(middlewareService, debug)
    {
        var core = require('../Core');

        middlewareService

            .add('Core', function(app,express)
            {
                express.use(core.middleware());
            })

            .add('Ajax', function(app,express)
            {
                express.use(function(request,response,next) {
                    request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
                    next();
                })
            })

            .add('Locale', function(app,express)
            {
                express.use(locale( app.conf('lang_support', ['en_us'])) );
                express.use(function(request,response,next) {
                    if (request.query.cc) {
                        request.locale = request.query.cc.toLowerCase();
                    }
                    next();
                })
            })

            .add('Static Content', function(app,express,path)
            {
                if (path.public) {
                    debug('ExpressProvider', 'Using static path: %s', path.public());
                    express.use(Express.static(path.public()));
                }
            })

            .add('Body Parser', function(app,express)
            {
                express.use(bodyParser.json());
                express.use(bodyParser.urlencoded({extended:true}));
                express.use(cookieParser(app.conf('appKey', "keyboard cat")));
            })

            .add('Session', function(app,express, driverProvider)
            {
                express.use(session ({
                    secret: app.conf('appKey', 'keyboard cat'),
                    saveUninitialized: false,
                    resave: false,
                    store: app.call(driverProvider,'getSessionStore')
                }));
            })

            .add('Flash', function(app,express)
            {
                express.use( flash() );
            });
    }

    /**
     * Called before the server starts.
     * @param express Express
     * @param path PathService
     * @param middlewareService MiddlewareService
     */
    onBootstrap(express,path,middlewareService)
    {
        return function(app) {

            express.set('view engine', app.conf('view_engine', 'ejs'));
            express.set('views', path.views());

            middlewareService.load();
        };
    }

    /**
     * Called when the server starts.
     * @param log Winston
     * @param url Function
     * @param event EventEmitter
     * @param express Express
     */
    onServerStart(log,url,event,express)
    {
        return function(app)
        {
            var config = app.config;

            express.listen(config.port, function()
            {
                log.info('Using root path: %s', app.rootPath());
                log.info(`Starting %s server v.%s on %s (%s)...`,
                    app.env,
                    app._version,
                    app.conf('url'),
                    url());

                event.emit('express.listening', express);
            });
        }
    }
}

module.exports = ExpressProvider;