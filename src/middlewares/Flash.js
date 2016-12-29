"use strict";

var Middleware = require('expressway').Middleware;
var flash      = require('connect-flash');

class Flash extends Middleware
{
    get description() {
        return "Provides session-based Flash messaging via connect-flash";
    }

    dispatch(extension)
    {
        var middleware = flash();
        return function Flash(...args)
        {
            return middleware(...args);
        }
    }
}

module.exports = Flash;

