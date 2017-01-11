"use strict";

var colors = require('colors/safe');
var stackParser = require('error-stack-parser');

class ApplicationCallError extends Error
{
    constructor(error,context,method)
    {
        super(error.message,1);

        this.error = error;
        this.context = context;
        this.method = method;

        let stack = stackParser.parse(this.thrown);

        this.message += "\n" + this.called;

        for (let i=0; i<3; i++) {
            let frame = stack[i];
            this.message += `\n-> ${colors.red(frame.functionName)} ${colors.gray(frame.fileName)}:${colors.blue(frame.lineNumber)}:${colors.blue(frame.columnNumber)}`;
        }

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