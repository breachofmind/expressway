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
            'CoreProvider',
            'DriverProvider'
        ];
        this.environments = [ENV_LOCAL, ENV_DEV];
        this.contexts = [CXT_TEST, CXT_CLI];
    }

    /**
     * Register the Seeder class with the application.
     * @param app Application
     * @param driverProvider DriverProvider
     * @param db object
     */
    register(app,driverProvider,db)
    {
        var Seeder = require('../classes/Seeder');

        if (driverProvider.alias == 'mongodb') {
            Seeder.getId = function() {
                return new db.Types.ObjectId;
            }
        }

        Expressway.Seeder = Seeder;

        app.register('Seeder', Seeder, "A class for seeding database records");
    }
}

module.exports = SeederProvider;