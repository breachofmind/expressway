"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var log = app.get('log');

class CoreMiddleware extends Expressway.Middleware
{
    dispatch(request,response,next)
    {
        /**
         * Handle the response value smartly.
         * @returns void
         */
        response.smart = (value,status) => {
            this.handleReturnValue(value,status,request,response);
        };

        response.redirectWithFlash = (to, key, body) =>
        {
            if (response.ajax) {
                return response.smart(body);
            }
            request.flash(key, body);
            return response.redirect(to);
        };

        /**
         * Send a response formatted for the API.
         * @param data mixed
         * @param status Number
         * @param metadata object, optional
         */
        response.api = (data,status,metadata) =>
        {
            response.status(status);

            var res = {
                statusCode: response.statusCode,
                message: response.phrase(),
                method: request.method,
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
        response.apiError = (err,status) =>
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

    /**
     * When the response completes, fire this event.
     * @param request
     * @param response
     * @returns {Function}
     */
    onResponseComplete(request,response)
    {
        return function()
        {
            var type = 'info';
            if (response.statusCode >= 400) type = 'warn';
            if (response.statusCode >= 500) type = 'error';

            // Not Modified, who cares
            if (response.statusCode == 304) return;

            log[type] ("%s %s %d '%s' %s %s %s",
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
}

module.exports = CoreMiddleware;

