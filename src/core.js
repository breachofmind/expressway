"use strict";

var codes = require('./support/status');

/**
 * Adds some helper functions to the request and response.
 * @param app Application
 */
module.exports = function Core (app)
{
    var utils = app.utils;
    var logger = app.logger;
    var View = app.View;

    /**
     * This is the main core middleware passed to express.
     * @returns function
     */
    return function(request,response,next)
    {

        request.controller = {name:null,method:null};

        /**
         * The response handler.
         * @param value mixed from controller
         * @param status Number code
         * @returns {*}
         */
        var handle = function(value,status)
        {
            // Headers were sent already or being handled differently.
            if (response.headersSent || value === true) {
                return null;
            }

            if (status) response.status(status);

            // Does not exist.
            if (! value || value === null || value === undefined)
            {
                return handle(response.view('error/404'), 404);
            }

            if (value.constructor && value.constructor.name == "Promise")
            {
                return value.then(function(returnValue){
                    return handle(returnValue);
                });
            }

            // Render the View object.
            if (value instanceof View)
            {
                return value.render(request,response);
            }

            // Convert objects to JSON and return JSON response.
            if (typeof value == "object")
            {
                return response.json(value.toJSON ? value.toJSON() : value);
            }

            // Value is string.
            return response.send(value);
        };

        /**
         * Return the absolute url of the request.
         * @returns {string}
         */
        request.absUrl = function()
        {
            return `${request.protocol}://${request.get('host')}${request.originalUrl}`;
        };

        /**
         * Set the controller name and method.
         * @param name
         * @param method
         */
        request.setController = function(name,method)
        {
            request.controller.name = name;
            request.controller.method = method;
        };

        /**
         * Return the name of the request controller name and method.
         * @returns {string}
         */
        request.controllerToString = function()
        {
            return request.controller.name + "." + request.controller.method;
        };

        /**
         * Return a query string value or the default value.
         * @param property string
         * @param defaultValue optional
         * @returns {string}
         */
        request.getQuery = function(property,defaultValue)
        {
            if (request.query && request.query.hasOwnProperty(property)) {
                return request.query[property];
            }
            return defaultValue;
        };

        /**
         * Alias to create a view.
         * @param file string
         * @param data object|null optional
         * @returns {View}
         */
        response.view = function(file,data)
        {
            return View.create(file,data);
        };

        /**
         * Handle the response smartly.
         * @param value
         * @param status
         */
        response.smart = function(value,status)
        {
            handle(value,status);
        };

        /**
         * Determine the phrase to use for the status code.
         * @returns {string}
         */
        response.phrase = function()
        {
            return codes[response.statusCode].phrase;
        };

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
            response.smart(res,status);
        };

        /**
         * Send an error response back.
         * @param err
         * @param status
         */
        response.apiError = function(err,status)
        {
            if (! err) err = {};
            var out = err.toJSON ? err.toJSON() : err;
            if (request.blueprint && err.code) {
                out.message = request.lang('model.err_'+err.code, [request.blueprint.name]);
            }
            if (err.name == "ValidationError") {
                out.message = request.lang('model.err_validation');
                out.errors = Object.keys(err.errors).map(function(key) {
                    var error = err.errors[key];
                    var label = request.blueprint ? request.lang('model.'+request.blueprint.name+"_"+error.path) : error.path;
                    return {
                        kind: error.kind,
                        path: error.path,
                        message: request.lang('model.err_'+error.kind, [label])
                    };
                })
            }
            return response.api(out, status || 400);
        };

        /**
         * Log a message for each request.
         */
        response.on('finish', function()
        {
            var type = 'info';
            if (response.statusCode >= 400) type = 'warn';
            if (response.statusCode >= 500) type = 'error';

            var controller = request.controller.name ? request.controllerToString() : 'static';

            // Not Modified, who cares
            if (response.statusCode == 304) return;

            logger.log(type, "%s %s %d '%s' %s %s %s",
                request.ip,
                request.method,
                response.statusCode,
                response.phrase(),
                controller,
                request.url,
                request.user ? request.user.id : ""
            );
        });

        next();
    };

};