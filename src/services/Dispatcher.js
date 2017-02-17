"use strict";

var expressway = require('../../expressway');
var express    = require('express');
var _          = require('lodash');

module.exports = function(app,debug,utils)
{
    /**
     * Handles the storage and retrieval of
     * controller and middleware classes.
     */
    class Dispatcher
    {
        /**
         * Return routes given a string.
         * @param name String controllerName.method|middlewareName
         * @param extension Extension
         * @returns {*}
         */
        routesFromString(name,extension)
        {
            let method;
            if (name.indexOf('.') > -1) {
                [name,method] = name.split(".");
            }
            return method
                ? app.controllers.dispatch(name,method,extension)
                : app.middleware.dispatch(name,extension);
        }

        /**
         * Return an express router given an object.
         * @param object Object {"verb uri": [middleware]}
         * @param extension Extension
         * @returns {*}
         */
        routesFromObject(object,extension)
        {
            let router = express.Router(extension.options || {});

            utils.toRouteMap(object).forEach((middleware,opts) =>
            {
                let stack = this.resolve(middleware, extension);

                if (! stack.length) throw new Error(`route declaration missing routes: ${opts.url}`);

                // Add the routes to the express router.
                router[opts.verb].apply(router, [opts.url].concat(stack) );
            });
            return router;
        }

        /**
         * Given a string or functions, return an array of
         * functions for the express router.
         * @param values {Array|Function|String}
         * @param extension Extension
         * @throws TypeError
         * @returns {Array}
         */
        resolve(values,extension)
        {
            if (! extension || !(extension instanceof expressway.Extension)) {
                throw new TypeError('extension is required');
            }

            let out = utils.castToArray(values).map( value =>
            {
                if (value === null || value === undefined) return null;

                switch(typeof value)
                {
                    case "object" :
                        return this.routesFromObject(value,extension);

                    case "string" :
                        return this.routesFromString(value,extension);

                    case "function" :
                        let fn = function anonymous(request,response,next) {
                            value.callable();
                            return app.call(value,null,[request,response,next]);
                        };
                        fn.$name = value.name;
                        return fn;

                    default:
                        return null;
                }
            });

            let middlewares = utils.compound(out);

            middlewares.forEach(middleware => {

                if (! middleware.$name) middleware.$name = middleware.name;
            });

            // Return the stack of functions to pass to express.route.
            // Remove any false values, express doesn't like it.
            // In the event nothing gets returned, send a default middleware.
            return middlewares.length ? middlewares : [utils.goToNext];
        }
    }

    return new Dispatcher;
};