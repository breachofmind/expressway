"use strict";
var express     = require('express'),
    mongoose    = require('mongoose'),
    bodyParser  = require('body-parser'),
    session     = require('express-session'),
    csrf        = require('csurf'),
    path        = require('path'),
    locale      = require('locale'),
    MongoStore  = require('connect-mongo')(session);

var Model       = require('./model'),
    Controller  = require('./controller'),
    Auth        = require('./auth'),
    core        = require('./core'),
    router      = require('./router'),
    lang        = require('./support/lang'),
    logger      = require('./support/logger'),
    utils       = require('./support/utils');

mongoose.Promise = require('bluebird');

var config, routes;


/**
 * The application class sets up the entire stack.
 * @constructor
 */
class Application
{
    /**
     * Constructor.
     * @returns Application
     */
    constructor()
    {
        config = require(Application.root+'config');
        routes = require(Application.root+'routes');

        Application.instance = this;

        this.environment = config.environment;
        this.locale      = lang.init();
        this.logger      = logger(this,config);
        this.config      = config;
        this.db          = mongoose;

        this.logger.profile('boot');
        this.db.connect(config.db);

        this._middlewares = [];
        this._models = Model.load(config.files.models);
        this._controllers = Controller.load(config.files.controllers);
    }

    /**
     * Initial setup of the server.
     * @returns Application
     */
    bootstrap()
    {
        this.express = express();

        this.express.set('view engine', config.view_engine || 'ejs');
        this.express.set('views', config.views || 'app/views');

        Application.middleware.forEach(function(func)
        {
            this._middlewares.push(func.constructor.name);
            let middleware = func(this);
            if (middleware) this.express.use(middleware);

        }.bind(this));

        routes.call(router(this));

        return this;
    }


    /**
     * Start the application server.
     * @returns Application
     */
    server()
    {
        this.express.listen(config.port, function()
        {
            this.logger.info(`Starting %s server on %s (%s)...`,
                config.environment,
                config.url,
                utils.url());
        }.bind(this));

        this.logger.profile('boot');

        return this;
    };

    /**
     * Named constructor.
     * @returns {Application}
     */
    static create()
    {
        if (Application.instance) {
            return Application.instance;
        }
        return new Application();
    }

    /**
     * Return a path relative to the root path.
     * @param filepath string
     * @returns {string}
     */
    static rootPath(filepath)
    {
        return path.normalize(Application.root+"/"+filepath);
    }

    /**
     * Return a path relative to the public path.
     * @param filepath string
     * @returns {string}
     */
    static publicPath(filepath)
    {
        return Application.rootPath("../"+config.static_uri+'/'+filepath);
    }
}

/**
 * The default application root directory.
 * This is where the config, routes, models and controller files are located.
 * @type {string}
 */
Application.root = path.normalize(path.dirname(__dirname) + "/app/");


/**
 * The Application singleton object.
 * @type {Application}
 */
Application.instance = null;

/**
 * The various route middlewares.
 * @type {*[]}
 */
Application.middleware = [
    function CoreMiddleware (app)
    {
        return function(request,response,next)
        {
            core(app,request,response);
            next();
        }
    },

    /**
     * Adds localization support.
     * @param app Application
     * @returns {Function}
     */
    function LocaleMiddleware (app)
    {
        app.express.use(locale(config.lang_support || ['en']));
        return function(request,response,next)
        {
            if (request.query.cc) {
                request.locale = request.query.cc.toLowerCase();
            }
            next();
        }
    },

    /**
     * Checks the request for a header to see if an AJAX request.
     * @param app Application
     * @returns {Function}
     */
    function AjaxMiddleware (app)
    {
        return function (request,response,next) {
            request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
            next();
        };
    },

    /**
     * Creates a static content uri.
     * @param app Application
     * @returns {null}|{Function}
     */
    function staticContentMiddleware (app)
    {
        return config.static_uri ? express.static(config.static_uri) : null;
    },

    /**
     * Parses the body response.
     * @param app Application
     */
    function bodyParserMiddleware (app)
    {
        app.express.use(bodyParser.json());
        app.express.use(bodyParser.urlencoded({extended:true}));
    },

    /**
     * Sets up the session middleware.
     * @param app Application
     * @returns {Function}
     */
    function SessionMiddleware (app)
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
     * @param app Application
     * @returns {Function}
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
    },

    /**
     * Set up the user authentication middleware.
     * @param app Application
     */
    function AuthMiddleware (app)
    {
        return Auth(app);
    }
];



module.exports = Application;