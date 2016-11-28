"use strict";

var Expressway = require('expressway');
var flash = require('connect-flash');

class Flash extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides session-based Flash messaging via connect-flash";
    }

    dispatch()
    {
        var middleware = flash();
        return function Flash(...args)
        {
            return middleware(...args);
        }
    }
}

module.exports = Flash;

