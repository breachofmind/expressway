"use strict";

var colors = require('colors/safe');

class ApplicationCallTypeError extends Error
{
    constructor(message,context,method)
    {
        super(message,1);

        this.context = context;
        this.method = method;

        this.message += "\n" + this.called;
    }

    get called()
    {
        return `at: ${colors.red(this.context.name)}` + (this.method ? `.${colors.red(this.method)}()` : "");
    }
}

global.ApplicationCallTypeError = ApplicationCallTypeError;