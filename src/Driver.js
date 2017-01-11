"use strict";

var _ = require('lodash');

/**
 * Methods that the parent driver should implement.
 * @type {[*]}
 */
const DRIVER_METHODS = ['all','first','find','findById','count','create','update','delete'];

/**
 * The base class for a database driver.
 * @constructor
 */
class Driver
{
    constructor()
    {
        this._models = {};
    }

    /**
     * Get the driver type definitions.
     * @returns {Object}
     */
    get types()
    {
        throw new Error('driver types are not defined for driver: '+this.name);
    }

    /**
     * Get the protected models index.
     * @returns {{}}
     */
    get models()
    {
        return this._models;
    }

    /**
     * Database connection implementation, which should return a Promise.
     * @returns {Promise}
     */
    connect()
    {
        throw new Error(this.name +'.connect() unimplemented');
    }

    /**
     * When a model boots, actions to perform on the schema.
     * @param blueprint Model
     */
    boot(blueprint)
    {
        throw new Error(this.name +'.boot(model) unimplemented');
    }

    /**
     * Return the methods
     * @param blueprint Model
     * @param model *
     */
    methods(blueprint, model)
    {
        function unimplemented(methodName) {
            return function() {
                throw new Error(`driver method unimplemented: ${blueprint.name}.${methodName}()`);
            }
        }
        let props = {model: model};

        // The parent driver should overwrite all of these methods.
        DRIVER_METHODS.forEach(methodName => {
            props[methodName] = unimplemented(methodName);
        });

        return props;
    }

    /**
     * Return a new ID when parsing a seed.
     * By default, returns the row index.
     * @param row {Object}
     * @param i {Number} index
     * @returns {Number}
     */
    newId(row,i)
    {
        return i+1;
    }

    /**
     * Set the model in the driver and create the prototype methods.
     * @param blueprint
     * @param model
     */
    assign(blueprint,model)
    {
        this.models[blueprint.name] = model;

        _.assign(blueprint, this.methods(blueprint,model));
    }
}

module.exports = Driver;