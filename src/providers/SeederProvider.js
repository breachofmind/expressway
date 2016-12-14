"use strict";

var Expressway = require('expressway');

/**
 * Provides the Seeder helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class SeederProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires('ModelProvider');

        this.environments([ENV_LOCAL, ENV_DEV]);
        this.contexts([CXT_TEST, CXT_CLI]);
    }

    /**
     * Register the Seeder class with the application.
     * @param app Application
     */
    register(app)
    {
        Expressway.Seeder = require('../Seeder');
    }
}

module.exports = SeederProvider;