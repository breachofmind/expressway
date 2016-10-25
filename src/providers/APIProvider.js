"use strict";

var crypto   = require('crypto');
var Expressway = require('expressway');

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
     */
    register(app)
    {
        app.register('RESTController', require('../controllers/RESTController'), "The default REST controller for the api");
    }
}

module.exports = APIProvider;