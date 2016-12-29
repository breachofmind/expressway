"use strict";

var Controller       = require('../Controller');
var ObjectCollection = require('../ObjectCollection');

module.exports = function(app,debug)
{
    /**
     * A collection of controller instances.
     */
    return new class ControllerService extends ObjectCollection
    {
        constructor()
        {
            super(app,'controller');

            this.class = Controller;

            this.on('add', (app,name,value) => {
                debug("ControllerService added: %s", name);
            });

            function controller(name) {
                return this.get(name);
            }

            app.service('controller', controller.bind(this));
        }

        /**
         * Return middleware functions for the given controller and method.
         * @param name string
         * @param method string
         * @param extension Extension
         * @throws TypeError
         * @returns {Array}
         */
        dispatch(name,method,extension)
        {
            if (! method) {
                return new TypeError(`controller method is required: ${name}`)
            }
            return this.get(name).dispatch(method,extension);
        }
    }
};