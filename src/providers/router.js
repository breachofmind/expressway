"use strict";
var mvc = require('../../index');
var utils = mvc.utils;

const verbs = ['get','post','put','patch','delete','options'];


/**
 * Router class.
 * A customized way to define routes for the application.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Router
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        var self = this;

        this.app = app;
        this.routes = [];

        // Set up the router methods.
        verbs.forEach(function(verb){
            self[verb] = route.call(this, verb);
        });

        // Common function for adding a route to each verb.
        function route(verb)
        {
            // object is a hash: { url: [string, function] }
            return function(object) {
                Object.keys(object).forEach(function(url) {
                    self.route(verb,url,object[url]);
                });
                return self;
            }
        }
    }

    /**
     * The default not found 404 handler.
     * Overwrite with a custom function if needed.
     * @param request
     * @param response
     * @param next
     */
    notFound(request,response,next)
    {
        return response.smart(response.view('error/404'),404);
    }

    /**
     * Create a new route.
     * @param verb string
     * @param url string
     * @param methods object
     * @returns Router
     */
    route(verb,url,methods)
    {
        var stack = utils.getRouteFunctions(methods, mvc.Controller);

        if (! stack.length) {
            throw ("Route declaration missing handler: "+url);
        }

        this.routes.push( new Route(verb,url,stack,this).addTo(this.app) );

        return this;
    }

    /**
     * Return a list of routes as a string by index.
     * @returns {Array}
     */
    list()
    {
        return this.routes.map(function(route) {
            return `#${route.index} ${route.verb} ${route.url}`;
        });
    }
}


/**
 * Route class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Route
{
    /**
     * Constructor
     * @param verb string get|post|patch|delete...
     * @param url string
     * @param methods array
     * @param router Router
     */
    constructor(verb,url,methods,router)
    {
        this._router = router;
        this.verb    = verb.toLowerCase();
        this.url     = url;
        this.methods = methods;
        this.index   = router.routes.length;
    }

    /**
     * Add this route to Express.
     * @param app Application
     * @returns {Route}
     */
    addTo(app)
    {
        app.express[this.verb].apply(app.express, [this.url].concat(this.methods));

        app.logger.debug('[Router] #%d: %s - %s (%d Middleware)',
            this.index,
            this.verb.toUpperCase(),
            this.url,
            this.methods.length
        );

        return this;
    }
}


/**
 * Provides the router functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouterProvider extends mvc.Provider
{
    constructor()
    {
        super('router');

        this.requires([
            'logger',
            'controller',
            'template',
            'express'
        ]);

        this.inside([ENV_LOCAL,ENV_DEV,ENV_PROD,ENV_TEST]);
    }

    register(app)
    {
        var routes = require(app.rootPath('config/routes'));

        // Attach the router class to the application.
        app.router = new Router(app);

        // After express is loaded, add the routes to it.
        app.event.on('application.bootstrap', function(app) {
            routes.call(app.router, app, app.Template);
            app.express.use(app.router.notFound);
        });
    }
}

module.exports = new RouterProvider();