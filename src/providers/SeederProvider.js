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

        this.requires = [
            'LoggerProvider',
            'DriverProvider'
        ];
        this.environments = [ENV_CLI];
    }

    /**
     * Register the Seeder class with the application.
     * @param app Application
     * @param DriverProvider DriverProvider
     * @param db object
     */
    register(app,DriverProvider,db)
    {
        var Seeder = require('./classes/Seeder');

        if (DriverProvider.alias == 'mongodb') {
            Seeder.getId = function() {
                return new db.Types.ObjectId;
            }
        }

        Expressway.Seeder = Seeder;

        app.register('Seeder', Seeder);
    }
}

module.exports = SeederProvider;