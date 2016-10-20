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
            'TemplateProvider',
            'ExpressProvider'
        ];
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
        var Router = require('../classes/Router');
        var router = new Router(app);

        app.register('router', router, "The Router instance, for adding routes to express");

        // After express is loaded, add the routes to it.
        event.once('application.bootstrap', app =>
        {
            app.call(routes, [router]);

            // Not Found is the last route to use.
            express.use(router.notFound);
        });
    }
}

module.exports = RouterProvider;