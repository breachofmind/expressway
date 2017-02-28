"use strict";

var stackParser = require('error-stack-parser');

class ApplicationCallError
{
    /**
     * Constructor.
     * @param error {Error}
     * @param context {string}
     * @param method {string}
     */
    constructor(error,context,method)
    {
        /**
         * The original thrown error.
         * Could be another ApplicationCallError.
         * @type {Error}
         */
        this.error = error;

        /**
         * The called function or object name.
         * @type {string}
         */
        this.context = context;

        /**
         * The called method.
         * @type {string}
         */
        this.method = method;

        /**
         * The error message.
         * @type {string}
         */
        this.message = `${error.message} at ${this.called}`;
    }

    /**
     * Return the name of the error.
     * @returns {String}
     */
    get name()
    {
        return this.constructor.name;
    }

    /**
     * The thrown error layers, parsed.
     * @type {Array}
     */
    get layers()
    {
        return stackParser.parse(this.thrown);
    }

    /**
     * Get the calling context and method.
     * @returns {string}
     */
    get called()
    {
        return this.context.name + (this.method ? `.${this.method}` : "");
    }

    /**
     * The actual thrown error stack.
     * @returns {string}
     */
    get stack()
    {
        return this.error.stack;
    }

    /**
     * Get the actual thrown error object that isn't an ApplicationCallError.
     * @returns {Error}
     */
    get thrown()
    {
        let thrown = this.error;
        while(thrown instanceof ApplicationCallError) {
            thrown = thrown.error;
        }
        return thrown;
    }

    /**
     * Go through each error in the error chain and check if they are call errors.
     * @param callback
     */
    each(callback)
    {
        let thrown = this.error;
        while(thrown instanceof ApplicationCallError) {
            callback(thrown);
            thrown = thrown.error;
        }
    }

    toString()
    {
        return this.message;
    }
}

global.ApplicationCallError = ApplicationCallError;