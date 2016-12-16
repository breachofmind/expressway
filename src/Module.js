"use strict";

var Provider   = require('./Provider');
var Express    = require('express');
var utils      = require('./support/utils');
var _          = require('lodash');

/**
 * A convenient way of creating sub-applications in express.
 * @constructor
 */
class Module extends Provider {

    constructor(app)
    {
        super(app);

        this.mounted = {};

        this.order(50);

        this.requires('ControllerProvider');

        /**
         * This module's express instance.
         * @type express
         */
        this.express = Express();

        /**
         * Options to pass to express.router.
         * @type {null|object}
         */
        this.options = null;

        /**
         * Routes to add to express.
         * If not using custom boot() method, fill this array.
         * @type {Array}
         */
        this.routes = [];

        /**
         * Middleware to add to express.
         * If not using custom boot() method, fill this array.
         * @type {Array}
         */
        this.middleware = [];

        /**
         * This module's base URI.
         * @type {string}
         */
        this.baseUri = "/";

        /**
         * If using the Static middleware,
         * static content paths to map to url's: uri:path
         * @type {{}}
         */
        this.staticPaths = {};

        app.register(this.name, this, "Express application Module instance");

        if (this.alias) {
            app.register(this.alias, this, "Alias to "+this.name);
        }

        this.express.$module = this;
    }

    /**
     * Set the parent express module.
     * @param parent Module|string
     */
    parent(parent)
    {
        if (typeof parent == 'string') {
            parent = this.app.get(parent);
        }

        if (! (parent instanceof Module)) {
            throw new TypeError("Argument not instance of Module");
        }

        parent.mount(this, this.baseUri);

        // Inherit the view engine and settings of the parent module.
        // You can always change this at the module provider level.
        var engine = parent.express.get('view engine');

        this.set('view engine', engine)
            .set('views', parent.express.get('views'))
            .engine(engine, parent.engine(engine));
    }

    /**
     * Mount another module on to this module.
     * @param moduleInstance Module
     * @param uri string
     */
    mount(moduleInstance, uri=null)
    {
        if (! uri) uri = moduleInstance.baseUri;
        this.mounted[uri] = moduleInstance;
        this.express.use(uri, moduleInstance.express);
    }

    /**
     * Set a key value in the express app.
     * @param key string
     * @param value mixed
     * @returns {Module}
     */
    set(key,value)
    {
        this.express.set(key,value);

        return this;
    }

    /**
     * Get or set the given engine.
     * @param ext string
     * @param fn Function
     * @returns {Module|Function}
     */
    engine(ext,fn)
    {
        if (! fn) return this.express.engines["."+ext];
        this.express.engine(ext,fn);

        return this;
    }

    /**
     * Default register method.
     * @param app Applicaiton
     * @param config function
     * @param path PathService
     */
    register(app,config,path)
    {
        this.set('views', path.views().get());
        this.set('view engine', config('view_engine','ejs'));
        this.set('env', app.env === ENV_PROD ? 'production' : 'development');
    }

    /**
     * Default boot method.
     * @returns void
     */
    boot()
    {
        this.add(this.middleware);
        this.add(this.routes);
        this.add('NotFound');
    }

    /**
     * Add objects to the app by the
     * directories in which they are located.
     * @param object
     * @returns Module
     */
    directories(object)
    {
        let services = {
            "models"      : 'modelService',
            "middlewares" : 'controllerService',
            "controllers" : 'controllerService',
            "localization": 'localeService',
        };

        _.each(services, (serviceName,key) =>
        {
            if (! object.hasOwnProperty(key)) return;

            let service = this.app.get(serviceName);
            let paths = Array.isArray(object[key]) ? object[key] : [object[key]];
            paths.forEach(path => {
                service.addDirectory(path);
            })
        });
        return this;
    }

    /**
     * Add some routes or middleware.
     * @param base string|object
     * @param routes string|object
     * @returns {Router}
     */
    add(base,routes)
    {
        // We're passing either a string or array
        // (global middleware) or an object (routes).
        if (arguments.length == 1) {
            routes = base;
            base = "/";
        }

        var controllerService = this.app.get('controllerService');

        // Add the router to the express application.
        this.express.use(base,controllerService.getRouteFunctions(routes, this));

        return this;
    }

    /**
     * Default server start method.
     * @param app Application
     * @param config function
     * @param url URLService
     * @param paths PathService
     * @param log Winston
     */
    serverStart(app,config,url,paths,log)
    {
        this.express.listen(config('port'), function()
        {
            log.info('Using root path: %s', paths.root());
            log.info(`Starting %s server v.%s on %s (%s)...`,
                app.env,
                app.version,
                config('url'),
                url());

            app.emit('express.listening',app);
        });
    }
}


module.exports = Module;