"use strict";

var colors = require('colors/safe');

class ApplicationLoadError extends Error
{
    constructor(message,provider,dependency)
    {
        super(message,1);
        this.message += "\nProvider: "+colors.red(provider.toString());
        if (dependency) {
            this.message += "\nDependency: "+colors.red(dependency.toString());
        }
    }
}

global.ApplicationLoadError = ApplicationLoadError;