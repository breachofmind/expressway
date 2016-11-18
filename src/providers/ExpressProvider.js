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
            'ControllerProvider',
            'RouterProvider',
        ];

        this.events = {
            'application.server' : 'serverStart',
        }
    }

    /**
     * Register the provider with the application.
     * @param app Application
     * @param router Router
     */
    register(app,router)
    {
        var $app = Express();

        router.mount('app', $app);

        app.register('$app', $app, "The main express app instance");
    }



    /**
     * Fire when all providers have been loaded.
     * @param app Application
     * @param config function
     * @param $app Express
     * @param path PathService
     */
    boot(app,config,$app,path)
    {
        $app.set('views', path.views().get());
        $app.set('view engine', config('view_engine','ejs'));
        $app.set('env', app.env === ENV_PROD ? 'production' : 'development');
    }

    /**
     * Fired when the server starts.
     * @param app
     * @param $app
     * @param config
     * @param log
     * @param url
     * @param path
     */
    serverStart(app,$app,config,log,url,path)
    {
        $app.listen(config('port'), function()
        {
            log.info('Using root path: %s', path.root().get());
            log.info(`Starting %s server v.%s on %s (%s)...`,
                app.env,
                app.version,
                config('url'),
                url());

            app.emit('express.listening', $app);
        });
    }
}

module.exports = ExpressProvider;