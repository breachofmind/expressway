"use strict";

var Express    = require('express');
var Expressway = require('expressway');

/**
 * Provides the express server and core middleware.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ExpressProvider extends Expressway.Provider
{
    constructor(app)
    {
        super(app);

        this.order = 10;

        this.requires = [
            'LoggerProvider',
            'ViewProvider',
            'CoreProvider',
            'ControllerProvider'
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param event EventEmitter
     */
    register(app,event)
    {
        var MiddlewareService = require('../services/MiddlewareService');

        var middlewareService = new MiddlewareService;

        app.register('middlewareService', middlewareService, "For storing and retrieving global express middleware");

        app.register('express', Express(), "The express instance");

        // Add the user-defined middleware stack.
        event.once('providers.registered', app => {
            app.config.middleware.forEach(name => {
                middlewareService.add(name);
            });
        });

        event.once('application.bootstrap', app.call(this,'onBootstrap'));

        event.once('application.server', app.call(this,'onServerStart'))
    }


    /**
     * Called before the server starts.
     * @param express Express
     * @param path PathService
     * @param middlewareService MiddlewareService
     */
    onBootstrap(express,path,middlewareService)
    {
        return function(app) {

            express.set('view engine', app.conf('view_engine', 'ejs'));
            express.set('views', path.views());
            if (app.env === ENV_PROD) {
                express.set('env', 'production');
            }

            middlewareService.load();
        };
    }

    /**
     * Called when the server starts.
     * @param log Winston
     * @param url Function
     * @param event EventEmitter
     * @param express Express
     */
    onServerStart(log,url,event,express)
    {
        return function(app)
        {
            var config = app.config;

            express.listen(config.port, function()
            {
                log.info('Using root path: %s', app.rootPath());
                log.info(`Starting %s server v.%s on %s (%s)...`,
                    app.env,
                    app._version,
                    app.conf('url'),
                    url());

                event.emit('express.listening', express);
            });
        }
    }
}

module.exports = ExpressProvider;