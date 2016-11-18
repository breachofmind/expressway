"use strict";

var crypto   = require('crypto');
var Expressway = require('expressway');
var express = require('express');

/**
 * Provides a basic JSON API.
 * @constructor
 */
class APIProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'ModelProvider',
            'LoggerProvider',
            'CoreProvider',
            'ControllerProvider',
            'RouterProvider',
            'ExpressProvider'
        ];
    }

    /**
     * Register with express.
     * @param app Application
     * @param router RouterFactory
     * @param $app Express
     * @param config function
     */
    register(app,router,$app,config)
    {
        var $api = express();

        router.mount('api',$api);

        app.register('$api', $api, "The REST API express sub-app instance");
        $app.use(config('api_baseuri','/api/v1'),$api);

        app.register('RESTController', require('../controllers/RESTController'), "The default REST controller for the api");
    }

    boot(router,RESTController)
    {
        router.api.add(['BodyParser','Session','BasicAuth']);
        router.api.add(RESTController.routes);
    }
}

module.exports = APIProvider;