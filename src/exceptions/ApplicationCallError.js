"use strict";

var colors = require('colors/safe');
var stack = require('callsite');

class ApplicationCallError extends Error
{
    constructor(message)
    {
        super(message,1);
        var ln = stack()[3];
        this.message += "\n"+colors.red(ln.toString());
    }
}

module.exports = ApplicationCallError;