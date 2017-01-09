"use strict";

var _ = require('lodash');

class Driver
{
    constructor()
    {
        this.models = {};
    }

    connect()
    {
        throw new Error('connect() unimplemented');
    }

    boot(model)
    {
        throw new Error('boot(model) unimplemented');
    }

    methods(model)
    {
        throw new Error('methods(model) unimplemented');
    }

    /**
     * Set the model in the driver and create the prototype methods.
     * @param blueprint
     * @param model
     */
    assign(blueprint,model)
    {
        this.models[blueprint.name] = model;

        _.extend(blueprint, this.methods(blueprint));
    }
}

module.exports = Driver;