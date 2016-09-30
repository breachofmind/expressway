"use strict";

var Expressway  = require('Expressway');
var codes       = require('./support/status');
var utils       = Expressway.utils;
var http        = require('http');

/**
 * The controller object name.
 * @type {{name: null, method: null}}
 */
http.IncomingMessage.prototype.controller = {name: null, method:null};

/**
 * Return the absolute url of the request.
 * @returns {string}
 */
http.IncomingMessage.prototype.absUrl = function()
{
    return `${this.protocol}://${this.get('host')}${this.originalUrl}`;
};

/**
 * Set the controller name and method.
 * @param name string
 * @param method string
 */
http.IncomingMessage.prototype.setController = function(name,method)
{
    this.controller.name = name;
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

/**
 * Alias to create a view.
 * @param file string
 * @param data object|null optional
 * @returns {View}
 */
http.ServerResponse.prototype.view = function(file,data)
{
    return Expressway.View.create(file,data);
};


/**
 * The Core class.
 * Adds some middleware and other functionality.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Core
{
    /**
     * Constructor
     * @param app Application
     * @param log Winston
     */
    constructor(app,log)
    {
        this.app = app;
        this.logger = log;
    }

    /**
     * When the response completes, fire this event.
     * @param request
     * @param response
     * @returns {Function}
     */
    onResponseComplete(request,response)
    {
        var core = this;

        return function()
        {
            var type = 'info';
            if (response.statusCode >= 400) type = 'warn';
            if (response.statusCode >= 500) type = 'error';

            // Not Modified, who cares
            if (response.statusCode == 304) return;

            core.logger.log(type,"%s %s %d '%s' %s %s %s",
                request.ip,
                request.method,
                response.statusCode,
                response.phrase(),
                request.controllerToString() ,
                request.url,
                request.user ? request.user.id : ""
            );
        }

    }

    /**
     * Core middleware to pass to express.
     */
    middleware()
    {
        return function(request,response,next)
        {
            /**
             * Handle the response value smartly.
             * @returns void
             */
            response.smart = function(value,status) {
                this.handleReturnValue(value,status,request,response);
            }.bind(this);

            /**
             * Send a response formatted for the API.
             * @param data mixed
             * @param status Number
             * @param metadata object, optional
             */
            response.api = function(data,status,metadata)
            {
                response.status(status);

                var res = {
                    statusCode: response.statusCode,
                    message: response.phrase(),
                    method: request.method,
                    url: request.absUrl(),
                    user: request.user ?  request.user.id : null
                };
                if (metadata) {
                    for (var prop in metadata) {
                        if (metadata.hasOwnProperty(prop)) {
                            res[prop] = metadata[prop];
                        }
                    }
                }
                res.data = data;

                return response.smart(res,status);
            };

            /**
             * Send an error response back. TODO
             * @param err
             * @param status number
             */
            response.apiError = function(err,status)
            {
                if (! err) err = {};
                var out = err.toJSON ? err.toJSON() : err;
                if (request.Model && err.code) {
                    out.message = request.lang('model.err_'+err.code, [request.Model.name]);
                }
                if (err.name == "ValidationError") {
                    out.message = request.lang('model.err_validation');
                    out.errors = Object.keys(err.errors).map(function(key) {
                        var error = err.errors[key];
                        var label = request.Model ? request.lang('model.'+request.Model.name+"_"+error.path) : error.path;
                        return {
                            kind: error.kind,
                            path: error.path,
                            message: request.lang('model.err_'+error.kind, [label])
                        };
                    })
                }
                return response.api(out, status || 400);
            };

            // Do this at the end of the response lifecycle.
            response.on('finish', this.onResponseComplete(request,response));

            return next();

        }.bind(this);
    }

    /**
     * The response handler.
     * @param value mixed from controller
     * @param status Number code
     * @param request
     * @param response
     * @returns {*}
     */
    handleReturnValue(value,status,request,response)
    {
        // Headers were sent already or being handled differently.
        if (response.headersSent || value === true) {
            return null;
        }

        if (status) response.status(status);

        // Does not exist.
        if (! value || value === null || value === undefined) {
            return handle(response.view('error/404'), 404);
        }

        if (value.constructor && value.constructor.name == "Promise")
        {
            return value.then(function(returnValue){
                return this.handleReturnValue(returnValue,status,request,response);
            }.bind(this));
        }

        // Render the View object.
        if (value instanceof Expressway.View) {
            return value.render(request,response);
        }

        // Convert objects to JSON and return JSON response.
        if (typeof value == "object") {
            return response.json(typeof value.toJSON === 'function' ? value.toJSON() : value);
        }

        // Value is string.
        return response.send(value);
    }
}

module.exports = Core;