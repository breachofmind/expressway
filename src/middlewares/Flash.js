"use strict";

var Expressway = require('expressway');
var flash = require('connect-flash');

class Flash extends Expressway.Middleware
{
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

