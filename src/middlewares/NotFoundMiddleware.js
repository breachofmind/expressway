"use strict";

var Expressway = require('expressway');

/**
 * The default not found 404 handler.
 * Overwrite with a custom function if needed.
 */
class NotFoundMiddleware extends Expressway.Middleware
{
    method(request,response,next)
    {
        return response.smart(response.view('error/404'),404);
    }
}

module.exports = NotFoundMiddleware;

