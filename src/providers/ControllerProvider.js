"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var http  = require('http');
var codes = require('../support/status');

/**
 * Provides the controller functionality and class creation.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerProvider extends Expressway.Provider
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'CoreProvider',
            'ModelProvider'
        ];
    }

    /**
     * Register the controller factory class with the app.
     * @param app Application
     * @param event EventEmitter
     * @param path PathService
     */
    register(app,event,path)
    {
        var ControllerService = require('../services/ControllerService');
        var controllerService = new ControllerService;

        app.register('controllerService', new ControllerService, 'Stores and fetches controller instances');

        // Expose the controller class for our wonderful developers.
        Expressway.Middleware = require('../classes/Middleware');
        Expressway.Controller = require('../classes/Controller');

        // All providers should be registered first,
        // In case we're using a provider that adds a controller.
        event.on('providers.registered', app => { app.call(this,'load') });
    }

    /**
     * Load all controllers defined in the ControllerService directories listing.
     * @param app Application
     * @param event EventEmitter
     * @param path PathService
     * @param controllerService ControllerService
     * @returns object
     */
    load(app,event,path,controllerService)
    {
        // System middleware
        controllerService.addDirectory(__dirname+"/../middlewares/");
        // User defined middleware
        controllerService.addDirectory(path.middlewares());
        // User defined controllers
        controllerService.addDirectory(path.controllers());

        // Any other directories to look in
        controllerService.directories.forEach(dir =>
        {
            controllerService.addDirectory(dir);
        });

        event.emit('controllers.loaded',app);
    }
}

/**
 * The controller object name.
 * @type {{name: null, method: null}}
 */
http.IncomingMessage.prototype.controller = {name: null, method:null};

/**
 * Set the controller name and method.
 * @param controller Controller
 * @param method string
 */
http.IncomingMessage.prototype.setController = function(controller,method)
{
    this.controller.name = controller.name;
    this.controller.method = method;
};

/**
 * Return the name of the request controller name and method.
 * @returns {string}
 */
http.IncomingMessage.prototype.controllerToString = function()
{
    if (! this.controller.name) {
        return 'static';
    }
    return this.controller.name + "." + this.controller.method;
};

/**
 * Return a query string value or the default value.
 * @param property string
 * @param defaultValue optional
 * @returns {string}
 */
http.IncomingMessage.prototype.getQuery = function(property,defaultValue)
{
    if (this.query && this.query.hasOwnProperty(property)) {
        return this.query[property];
    }
    return defaultValue;
};

/**
 * Determine the phrase to use for the status code.
 * @returns {string}
 */
http.ServerResponse.prototype.phrase = function()
{
    return codes[this.statusCode].phrase;
};

module.exports = ControllerProvider;