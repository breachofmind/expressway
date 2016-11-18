"use strict";

var Expressway = require('expressway');

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
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        var Router = require('../classes/Router');
        var router = new Router;

        app.register('router', router, "The Router instance, for adding routes to the core application");

        app.on('view.created', function(view,request) {
            view.data.route = function(name, uri) {
                return router.to(name,uri);
            }
        });

        app.register('stacks', router.stacks.bind(router), "Route stack for all applications");
    }
}

module.exports = RouterProvider;