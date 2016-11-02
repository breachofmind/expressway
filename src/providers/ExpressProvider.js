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
     * @param config function
     * @param path PathService
     * @param log Winston
     * @param url URLService
     */
    register(app,event,config,path,log,url)
    {
        var MiddlewareService = require('../services/MiddlewareService');
        var middlewareService = new MiddlewareService;
        var $app = Express();

        app.register('$app', $app, "The main express app instance");

        app.register('middlewareService', middlewareService, "For storing and retrieving global express middleware");

        event.once('application.server', app =>
        {
            $app.listen(config('port'), function()
            {
                log.info('Using root path: %s', path.root().get());
                log.info(`Starting %s server v.%s on %s (%s)...`,
                    app.env,
                    app._version,
                    config('url'),
                    url());

                event.emit('express.listening', $app);
            });
        })
    }


    /**
     * Fire when all providers have been loaded.
     * @param app Application
     * @param config function
     * @param middlewareService MiddlewareService
     * @param $app Express
     * @param path PathService
     */
    boot(app,config,middlewareService,$app,path)
    {
        $app.set('views', path.views().get());
        $app.set('view engine', config('view_engine','ejs'));
        $app.set('env', app.env === ENV_PROD ? 'production' : 'development');

        // Add the user-defined middleware stack.
        config('middleware', []).forEach(name => { middlewareService.add(name) });

        middlewareService.load();
    }
}

module.exports = ExpressProvider;