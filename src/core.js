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
    var logger = app.logger;

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
            return handle(request.view('error/404'), 404);
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
     * Alias to create a view.
     * @param file string
     * @param data object|null optional
     * @returns {View}
     */
    request.view = function(file,data)
    {
        return View.create(file,data);
    };

    /**
     * Turn around the request into a response.
     * @param value mixed from controller
     * @param status Number code
     */
    request.send = function(value,status)
    {
        handle(value,status);
    };

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
            url: request.url,
            user: request.user,
            pagination: request.pagination||null,
            data: data
        };
        request.send(res,status);
    };

    response.on('finish', function() {
        logger.info('%s %d "%s" %s %j', request.method, response.statusCode, response.phrase(), request.url, request.controller);
    });
};