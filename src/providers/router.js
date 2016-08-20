"use strict";

var Provider = require('../provider');

/**
 * Provides the router functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouterProvider extends Provider
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
        var utils = app.utils;

        var routes = [];

        var appRoutes = require(app.rootPath('config/routes'));

        // Attach the router class to the application.
        app.router = new Router();

        /**
         * Route class.
         * Creating a new route will attach it to the express router.
         *
         * @param verb string get|post|put|delete...
         * @param url string
         * @param methods array|string
         * @constructor
         */
        function Route(verb,url,methods)
        {
            this.verb = verb;
            this.url = url;
            this.methods = utils.getRouteFunctions(app,methods);
            this.order = routes.length;
            this.controller = typeof methods == 'string' ? methods : null;

            if (! this.methods.length) {
                throw ("Route declaration missing handler: "+url);
            }

            routes.push(this);

            // Adds it to the express server.
            app.express[verb].apply(app.express, [url].concat(this.methods));

            app.logger.debug('[Router] #%d: %s - %s (%d Middleware)',
                this.order,
                verb.toUpperCase(),
                url,
                this.methods.length
            );
        }

        /**
         * The router class to export.
         * @constructor
         */
        function Router()
        {
            this.get = route.call(this,'get');
            this.post = route.call(this,'post');
            this.put = route.call(this,'put');
            this.patch = route.call(this,'patch');
            this.delete = route.call(this,'delete');
            this.options = route.call(this,'options');

            /**
             * Return a list of the routes created.
             * @returns {object|array}
             */
            this.list = function(index)
            {
                return arguments.length ? routes[index] : routes;
            };

            /**
             * Create a new route.
             * @param verb string get|post|put|patch|delete|options
             * @returns {Function}
             */
            function route(verb)
            {
                return function(object)
                {
                    for(let routeUrl in object) {
                        new Route(verb, routeUrl, object[routeUrl]);
                    }
                    return this;
                }.bind(this);
            }
        }

        // After express is loaded, add the routes to it.
        app.event.on('application.bootstrap', function(app) {
            appRoutes.call(app.router, app, app.Template);
        });
    }
}

module.exports = new RouterProvider();