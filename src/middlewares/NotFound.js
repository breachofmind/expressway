"use strict";

var Expressway = require('expressway');

/**
 * The default not found 404 handler.
 * Overwrite with a custom function if needed.
 */
class NotFound extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "The default 404 Not Found response";
    }
    method(request,response,next,view)
    {
        response.status(404);

        return view('error/404');
    }
}

module.exports = NotFound;

