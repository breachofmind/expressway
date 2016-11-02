"use strict";

var Expressway = require('expressway');

/**
 * The default not found 404 handler.
 * Overwrite with a custom function if needed.
 */
class NotFoundMiddleware extends Expressway.Middleware
{
    method(request,response,next,view)
    {
        response.status(404);

        return view('error/404');
    }
}

module.exports = NotFoundMiddleware;

