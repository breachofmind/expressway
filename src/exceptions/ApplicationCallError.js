"use strict";

var colors = require('colors/safe');

class ApplicationCallError extends Error
{
    constructor(message,context,method)
    {
        super(message,1);

        this.message += "\nat: "+colors.red(context.name);
        if (method) {
            this.message += "."+colors.red(method)+"()";
        }
    }
}

global.ApplicationCallError = ApplicationCallError;