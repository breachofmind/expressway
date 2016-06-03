"use strict";

var View = require('./view');
var codes = require('./support/status');

/**
 * Adds some helper functions to the request and response.
 * @param request
 * @param response
 */
module.exports = function Core (request,response)
{
    var app = require('./application').instance;
    var utils = require('./support/utils');
    var logger = app.logger;

    request.controller = {name:null,method:null};

    /**
     * The response handler.
     * @param value mixed from controller
     * @param status Number code
     * @returns {*}
     */
    var handle = function(value,status)
    {
        // Headers were sent already.
        if (response.headersSent || typeof value==="undefined") {
            return null;
        }

        if (status) response.status(status);

        // Does not exist.
        if (! value || value === null)
        {
            return handle(response.view('error/404'), 404);
        }

        // Send a promise through the handler again.
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

    request.controllerToString = function()
    {
        return request.controller.name + "@" + request.controller.method;
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
     * @param data
     * @param status
     */
    response.api = function(data,status)
    {
        response.status(status);

        var res = {
            statusCode: response.statusCode,
            message: response.phrase(),
            method: request.method,
            url: request.absUrl(),
            user: request.user,
            pagination: request.pagination||null,
            data: data
        };
        response.smart(res,status);
    };

    /**
     * Log a message for each request.
     */
    response.on('finish', function()
    {
        var type = 'info';
        if (response.statusCode >= 400) type = 'warn';
        if (response.statusCode >= 500) type = 'error';

        logger[type]('[%s] %s %s %d "%s" %s %s',
            new Date(),
            request.ip,
            request.method,
            response.statusCode,
            response.phrase(),
            request.controller.name ? request.controllerToString() : 'static',
            request.url
        );
    });
};