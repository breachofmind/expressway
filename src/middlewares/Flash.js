"use strict";

var Expressway = require('expressway');
var flash = require('connect-flash');

class Flash extends Expressway.Middleware
{
    dispatch()
    {
        return function Flash(...args) {
            return flash()(...args);
        };
    }
}

module.exports = Flash;

