"use strict";

var colors = require('colors/safe');

class ApplicationCallError extends Error
{
    constructor(error,context,method)
    {
        super(error.message,1);

        this.error = error;
        this.context = context;
        this.method = method;

        this.message += "\n" + this.called;
    }

    each(callback)
    {
        let thrown = this.error;
        while(thrown instanceof ApplicationCallError) {
            callback(thrown);
            thrown = thrown.error;
        }
    }

    get called()
    {
        return `at: ${colors.red(this.context.name)}` + (this.method ? `.${colors.red(this.method)}()` : "");
    }

    get thrown()
    {
        let thrown = this.error;
        while(thrown instanceof ApplicationCallError) {
            thrown = thrown.error;
        }
        return thrown;
    }
}

global.ApplicationCallError = ApplicationCallError;