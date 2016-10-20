"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var Path = require('path');
var app = Expressway.instance.app;
var trimEnd = require('lodash').trimEnd;
var [debug,path] = app.get('debug','path');

/**
 * Handles the storage and retrieval of controller classes.
 * @author Mike Adamczyk <mike@bom.us>
 * @since 0.6.0
 */
class ControllerService
{
    constructor()
    {
        this.controllers = {};
        this.middlewares = {};

        this.directories = [
            path.controllers()
        ];
    }

    /**
     * Check if the given controller is in the index.
     * @param controllerName string
     * @returns {boolean}
     */
    has(controllerName)
    {
        return this.controllers.hasOwnProperty(controllerName);
    }

    /**
     * Add a new controller class.
     * @param Controller string|Controller|Middleware
     * @throws Error
     * @returns {Controller|Middleware}
     */
    add(Controller)
    {
        var path;
        if (typeof Controller == "string") {
            path = Controller;
            Controller = require(path);
        }
        var instance = app.call(Controller);

        if (instance instanceof Expressway.Controller || instance instanceof Expressway.Middleware)
        {
            var type = instance.constructor.__proto__.name;

            this[type.toLowerCase()+"s"][instance.name] = instance;

            debug(this,`Loaded ${type}: %s`, instance.name);

            return instance;
        }

        throw new Error("Unable to add controller, not a Controller or Middleware instance: "+path);
    }

    /**
     * Add all files in a directory.
     * @param dir string
     */
    addDirectory(dir)
    {
        utils.getModules(Path.normalize(dir), moduleName => {
            this.add(moduleName);
        });
    }

    /**
     * Get a controller by name.
     * @param controllerName string
     * @throws Error
     * @returns {Controller}
     */
    get(controllerName)
    {
        if (! this.has(controllerName)) {
            throw new Error(`"${controllerName}" controller does not exist`);
        }
        return this.controllers[controllerName];
    }

    /**
     * Get a middleware by name.
     * @param middlewareName string
     * @returns {null|Middleware}
     */
    getMiddleware(middlewareName)
    {
        return this.middlewares.hasOwnProperty(middlewareName) ? this.middlewares[middlewareName] : null;
    }

    /**
     * Dispatch a controller.
     * @param controllerName string
     * @param method string
     * @returns {array|*}
     */
    dispatch(controllerName,method)
    {
        return this.get(controllerName).dispatch(method);
    }
}

module.exports = ControllerService;