"use strict";

class NotFoundException extends Error
{
    constructor(message,thrown)
    {
        super(message,1);

        /**
         * The actual error that was thrown.
         * @type {Error}
         */
        this.error = thrown;
    }

    get name()
    {
        return this.constructor.name;
    }
}

global.NotFoundException = NotFoundException;