"use strict";

var colors = require('colors/safe');

class MissingDependencyException extends Error
{
    constructor(message,dependencyName,extension)
    {
        super(message,1);

        this.message += "\nmissing: "+colors.red(dependencyName);
        this.message += "\n"+colors.cyan(dependencyName+" needs to be added before "+extension);

    }
}

global.MissingDependencyException = MissingDependencyException;