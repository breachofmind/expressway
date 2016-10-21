"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var http  = require('http');
var Promise = require('bluebird');
var colors = require('colors/safe');

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
            'ModelProvider',
            'ViewProvider'
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
    return http.STATUS_CODES[this.statusCode];
};

/**
 * Alias to create a view.
 * @param file string
 * @param data object|null optional
 * @param status {Number} optional
 * @returns {View}
 */
http.ServerResponse.prototype.view = function(file,data,status = 200)
{
    if (typeof data === 'number') {
        status = data;
        data = {};
    }
    this.status(status);
    return new Expressway.View(file,data).render(this.req,this);
};

/**
 * Turn on logging for this response.
 * @returns void
 */
http.ServerResponse.prototype.logResponse = function(app)
{
    var log = app.get('log');

    this.on('finish', () =>
    {
        var type = 'info';
        if (this.statusCode >= 400) type = 'warn';
        if (this.statusCode >= 500) type = 'error';

        // Not Modified, who cares
        if (this.statusCode == 304) return;

        var methodColor = "gray";
        if (this.req.method == "POST") methodColor = "yellow";
        if (this.req.method == "PUT") methodColor = "magenta";
        if (this.req.method == "DELETE") methodColor = "red";

        log[type] ("%s %s %s '%s' %s %s %s",
            this.req.ip,
            colors[methodColor] (this.req.method),
            colors.blue(this.statusCode),
            this.phrase(),
            colors.green(this.req.controllerToString()) ,
            this.req.url,
            this.req.user ? colors.gray(this.req.user.id) : ""
        );
    });
};

/**
 * Return a smart response, based on the given value.
 * @param value mixed
 * @param status {Number}
 * @returns {*}
 */
http.ServerResponse.prototype.smart = function(value,status)
{
    // Headers were sent already or being handled differently.
    if (this.headersSent || value === true || value === undefined) {
        return null;
    }

    if (status) this.status(status);

    if (value === false || value === null) {
        // Does not exist.
        return this.view('error/404', 404);

    } else if (value instanceof Promise) {
        // Execute the promise, and then recursively try again.
        return value.then(returnValue => { return this.smart(returnValue) });

    } else if (value instanceof Expressway.View) {
        // Render the View object.
        return value.render(this.req,this);

    } else if (typeof value == "object") {
        // Convert objects to JSON and return JSON response.
        return this.json(typeof value.toJSON === 'function' ? value.toJSON() : value);
    }

    // Value is string.
    return this.send(value);
};

/**
 * Send a response formatted for the API.
 * @param data mixed
 * @param status Number
 * @param metadata object, optional
 */
http.ServerResponse.prototype.api = function(data,status,metadata)
{
    this.status(status);

    var response = {
        statusCode: this.statusCode,
        message: this.phrase(),
        method: this.req.method,
        user: this.req.user ?  this.req.user.id : null
    };
    if (metadata) {
        for (var prop in metadata) {
            if (metadata.hasOwnProperty(prop)) {
                response[prop] = metadata[prop];
            }
        }
    }
    response.data = data;

    return this.smart(response,status);
};

/**
 * If using flash middleware, redirect with a flash message.
 * @param to string
 * @param key string
 * @param body object
 * @returns {*}
 */
http.ServerResponse.prototype.redirectWithFlash = function(to,key,body)
{
    if (this.ajax) {
        return this.smart(body);
    }
    this.req.flash(key, body);

    return this.redirect(to);
};


/**
 * Send an error response back. TODO
 * @param err
 * @param status number
 */
http.ServerResponse.prototype.apiError = function(err,status)
{
    if (! err) err = {};
    var out = err.toJSON ? err.toJSON() : err;

    if (this.req.Model && err.code) {
        out.message = this.req.lang('model.err_'+err.code, [this.req.Model.name]);
    }
    if (err.name == "ValidationError") {
        out.message = this.req.lang('model.err_validation');
        out.errors = Object.keys(err.errors).map( key =>
        {
            var error = err.errors[key];
            var label = this.req.Model ? request.lang('model.'+this.req.Model.name+"_"+error.path) : error.path;
            return {
                kind: error.kind,
                path: error.path,
                message: this.req.lang('model.err_'+error.kind, [label])
            };
        })
    }
    return this.api(out, status || 400);
};

module.exports = ControllerProvider;