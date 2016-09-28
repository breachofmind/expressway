"use strict";
var expressway = require('expressway');
var utils = expressway.utils;

const VERBS = ['get','post','put','patch','delete','options'];


/**
 * Provides the router functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouterProvider extends expressway.Provider
{
    constructor()
    {
        super('router');

        this.requires = [
            'LoggerProvider',
            'ControllerProvider',
            'TemplateProvider',
            'ExpressProvider'
        ];

        this.inject = ['Template','express','events'];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param Template Template
     * @param express Express
     * @param event EventEmitter
     */
    register(app, Template, express, event)
    {
        var routes = require(app.rootPath('config/routes'));

        var Router = app.call(this,'getRouterClass',[app,'log','express']);
        var router = new Router(app);

        app.register('Router', router);


        // After express is loaded, add the routes to it.
        event.once('application.bootstrap', function(app)
        {
            routes.apply(router, [app,Template]);
            express.use(router.notFound);
        });
    }

    /**
     * Return the Router class.
     * @param app Application
     * @param log Winston
     * @param express Express
     * @returns {Router}
     */
    getRouterClass(app,log,express)
    {
        class Route
        {
            constructor(verb,url,methods)
            {
                this.index = null;
                this.verb = verb.toLowerCase();
                this.url = url;
                this.methods = methods;

                if(! methods.length) {
                    throw new Error("Route declaration missing handler: "+url);
                }
            }

            addTo(router)
            {
                this.index = router.routes.length;
                express[this.verb].apply(express, [this.url].concat(this.methods));
                log.debug('[Router] #%d: %s - %s (%d Middleware)',
                    this.index,
                    this.verb.toUpperCase(),
                    this.url,
                    this.methods.length
                );
                router.routes.push(this);
            }
        }

        /**
         * Router class.
         * A customized way to define routes for the application.
         * @author Mike Adamczyk <mike@bom.us>
         */
        return class Router
        {
            constructor()
            {
                var routers = this;

                this.routes = [];

                // Verb method setup.
                // Exposed to developer in routes.js config.
                VERBS.map(function(verb) {
                    router[verb] = (function(verb){

                        // object is a hash: { url: [string, function] }
                        return function(object) {
                            Object.keys(object).forEach(function(url) {
                                var stack = utils.getRouteFunctions(object[url], expressway.Controller);
                                new Route(verb,url,stack).addTo(router);
                            });
                            return router;
                        }
                    })(verb);
                });
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
            };

            /**
             * Return a list of routes as a string by index.
             * @returns {Array}
             */
            list()
            {
                return routes.map(function(route) {
                    return `#${route.index}\t${route.verb.toUpperCase()}\t${route.url}`;
                });
            };
        }
    }


}

module.exports = new RouterProvider();