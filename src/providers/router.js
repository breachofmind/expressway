"use strict";
var expressway = require('expressway');
var utils = expressway.utils;

const VERBS = ['get','post','put','patch','delete','options'];

/**
 * Router class.
 * A customized way to define routes for the application.
 * @author Mike Adamczyk <mike@bom.us>
 */
function Router(app)
{
    var router = this;
    var routes = [];

    // Verb method setup.
    // Exposed to developer in routes.js config.
    VERBS.map(function(verb) {
        router[verb] = (function(verb){

            // object is a hash: { url: [string, function] }
            return function(object) {
                Object.keys(object).forEach(function(url) {
                    var stack = utils.getRouteFunctions(object[url], expressway.Controller);
                    new Route(verb,url,stack);
                });
                return router;
            }
        })(verb);
    });

    /**
     * The default not found 404 handler.
     * Overwrite with a custom function if needed.
     * @param request
     * @param response
     * @param next
     */
    this.notFound = function(request,response,next)
    {
        return response.smart(response.view('error/404'),404);
    };

    /**
     * Return a list of routes as a string by index.
     * @returns {Array}
     */
    this.list = function()
    {
        return routes.map(function(route) {
            return `#${route.index}\t${route.verb.toUpperCase()}\t${route.url}`;
        });
    };

    /**
     * Route class.
     * @constructor
     */
    function Route(verb,url,methods)
    {
        if (! methods.length) {
            throw ("Route declaration missing handler: "+url);
        }

        this.verb    = verb.toLowerCase();
        this.url     = url;
        this.methods = methods;
        this.index   = routes.length;

        routes.push(this);

        // Add the route to express.
        // ie, app.express.get("/url", function(){...}, function(){...})
        app.express[this.verb].apply(app.express, [this.url].concat(this.methods));

        app.logger.debug('[Router] #%d: %s - %s (%d Middleware)',
            this.index,
            this.verb.toUpperCase(),
            this.url,
            this.methods.length
        );
    }
}


/**
 * Provides the router functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouterProvider extends expressway.Provider
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