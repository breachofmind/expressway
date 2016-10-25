"use strict";

var colors = require('colors/safe');

class ApplicationCallError extends Error
{
    constructor(message)
    {
        super(message,1);

        this.message += "\n"+colors.red(__stack[3].toString());
    }
}

module.exports = ApplicationCallError;