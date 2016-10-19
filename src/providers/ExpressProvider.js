"use strict";


var Core            = require('../Core');
var express         = require('express');
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



        this.middlewares = [];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param event EventEmitter
     * @param debug function
     */
    register(app,event,debug)
    {
        var MiddlewareStack = require('./classes/MiddlewareStack');

        this.middlewareStack = new MiddlewareStack();

        var core = app.call(Core);
        var server = express();

        this.middlewareStack

            .add('Core', function(app,server)
            {
                server.use(core.middleware());
            })

            .add('Ajax', function(app,server)
            {
                server.use(function(request,response,next) {
                    request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
                    next();
                })
            })

            .add('Locale', function(app,server)
            {
                server.use(locale( app.conf('lang_support', ['en_us'])) );
                server.use(function(request,response,next) {
                    if (request.query.cc) {
                        request.locale = request.query.cc.toLowerCase();
                    }
                    next();
                })
            })

            .add('Static Content', function(app,server)
            {
                if (app.conf('static_path')) {
                    var path = app.path('static_path');
                    debug('ExpressProvider', 'Using static path: %s', path);
                    server.use(express.static(path));
                }
            })

            .add('Body Parser', function(app,server)
            {
                server.use(bodyParser.json());
                server.use(bodyParser.urlencoded({extended:true}));
                server.use(cookieParser(app.conf('appKey', "keyboard cat")));
            })

            .add('Session', function(app,server)
            {
                var driver = app.get('DriverProvider');
                server.use(session ({
                    secret: app.conf('appKey', 'keyboard cat'),
                    saveUninitialized: false,
                    resave: false,
                    store: app.call(driver,'getSessionStore')
                }));
            })

            .add('Flash', function(app,server)
            {
                server.use( flash() );
            });

        app.register('express', server, "The express instance");
        app.register('ExpressProvider', this, "The Express Provider instance, for adding core middleware");

        event.on('application.bootstrap', this.onBootstrap());

        event.on('application.server', app.call(this,'onServerStart'))
    }

    /**
     * Called before the server starts.
     */
    onBootstrap()
    {
        return function(app) {
            var server = app.get('express');

            server.set('view engine', app.conf('view_engine', 'ejs'));
            server.set('views', app.path('views_path', 'resources/views'));

            this.middleware = this.middlewareStack.load(server);
        }.bind(this);
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