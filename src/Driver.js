"use strict";

/**
 * Basic DB driver class.
 * Provides an interface for DB drivers.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Driver
{
    /**
     * Constructor
     * @param app Application
     * @param ModelClass Model
     */
    constructor(app, ModelClass)
    {
        this.name = this.constructor.name;
        this.app = app;
        this.Model = ModelClass;
    }

    /**
     * Register with the application.
     * Called in the ModelProvider.
     * @param provider ModelProvider
     */
    register(provider)
    {
        throw new Error(`Driver "${this.name}" register unimplemented`);
    }

    /**
     * Used with express.
     * Every DB driver should have a session-handling store.
     * @returns Store
     */
    getSessionStore()
    {
        throw new Error(`Driver "${this.name}" getSessionStore unimplemented`);
    }
}

module.exports = Driver;