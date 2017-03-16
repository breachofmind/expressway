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

            this.on('add', (name,value) => {
                debug("ControllerService added: %s", name);
            });

            app.service('controller', controller.bind(this));
        }

        /**
         * Return middleware functions for the given controller and method.
         * @param name {String}
         * @param method {String}
         * @param extension {Extension}
         * @throws {TypeError}
         * @returns {Array}
         */
        dispatch(name,method,extension)
        {
            if (! method) {
                return new TypeError(`controller method is required: ${name}`)
            }
            return this.get(name).dispatch(method,extension);
        }

        /**
         * Add a method to a previously created controller object.
         * Useful if taking advantage of that controller's global middleware stack.
         * @param controllerName {String}
         * @param methodName {String}
         * @param fn {Function}
         * @param middleware {Array}
         * @throws {Error|TypeError}
         * @returns {ControllerService}
         */
        addMethod(controllerName,methodName,fn,middleware=null)
        {
            var controller = this.get(controllerName);

            if (controller.hasOwnProperty(methodName)) {
                throw new Error('controller method exists: ${methodName}');
            } else if (typeof fn !== 'function') {
                throw new TypeError('argument must be a middleware function');
            }

            // Attach the method to the controller.
            controller[methodName] = fn;

            if (middleware) {
                controller.middleware(methodName,middleware);
            }

            debug('ControllerService method %s.%s assigned', controllerName,methodName);

            return this;
        }
    }
};

/**
 * Helper function to get controllers.
 * @param name string
 */
function controller(name)
{
    return this.get(name);
}