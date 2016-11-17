"use strict";

var Expressway = require('expressway');
var Router = require('express').Router;

/**
 * Provides the router functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouterProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'ControllerProvider',
            'ViewProvider',
            'ExpressProvider'
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param $app Express
     */
    register(app,$app)
    {
        var Router = require('../classes/Router');
        var router = new Router;

        router.mount('app',$app);

        app.register('router', router,
            "The Router instance, for adding routes to the core application");

        app.on('view.created', function(view,request) {
            view.data.route = function(name, uri) {
                return router.to(name,uri);
            }
        })
    }


    /**
     * Fire when all providers are loaded.
     * @param app Application
     * @param router Router
     * @param middlewareService MiddlewareService
     * @param $app Express
     */
    boot(app,router,middlewareService,$app)
    {
        var routes = require(app.rootPath('config/routes'));

        app.call(routes, [router]);

        // The default Not Found route handler,
        // when no matching route is found.
        middlewareService.use('NotFound');

        function getStack() {
            return Expressway.utils.getMiddlewareStack($app);
        }

        app.register('stack', getStack, "The route stack", true);
    }
}

module.exports = RouterProvider;