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
            'ModelProvider'
        ];
        this.environments = [ENV_CLI];
    }

    /**
     * Register the Seeder class with the application.
     * @param app Application
     * @param ModelProvider ModelProvider
     * @param db object
     */
    register(app,ModelProvider,db)
    {
        var Seeder = require('./classes/Seeder');

        if (ModelProvider.driver.name == 'MongoDriver') {
            Seeder.getId = function() {
                return new db.Schema.Types.ObjectId;
            }
        }

        app.register('Seeder', Seeder);
    }
}

module.exports = SeederProvider;