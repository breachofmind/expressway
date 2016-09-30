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

        this.inject = ['Template','express','event'];
    }

    /**
     * Register the provider with the application.
     * @param Template Template
     * @param express Express
     * @param event EventEmitter
     */
    register(Template, express, event)
    {
        var routes = require(this.app.rootPath('config/routes'));
        var Router = require('./classes/Router');
        var router = new Router(this.app);

        this.app.register('router', router);

        // After express is loaded, add the routes to it.
        event.once('application.bootstrap', function(app)
        {
            routes.apply(router, [app,Template]);

            // Not Found is the last route to use.
            express.use(router.notFound);
        });
    }
}

module.exports = RouterProvider;