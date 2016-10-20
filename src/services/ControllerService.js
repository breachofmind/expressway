"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
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
        this.directories = [
            path.controllers("/")
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
     * @param Controller string|Controller
     * @throws Error
     * @returns {Controller}
     */
    add(Controller)
    {
        var path;
        if (typeof Controller == "string") {
            path = Controller;
            Controller = require(path);
        }
        var instance = app.call(Controller);
        if (! (instance instanceof Expressway.Controller)) {
            throw new Error("Unable to add controller, not a Controller instance: "+path);
        }
        debug(this,'Loaded: %s', instance.name);

        return this.controllers[instance.name] = instance;
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