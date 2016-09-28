"use strict";

var expressway = require('expressway');

class DriverProvider extends expressway.Provider
{
    constructor()
    {
        super('driver');

        this.requires('logger');

        this.inject('Log');
    }

    register(app,logger)
    {
        var driver = app.conf('db_driver', 'mongo');

        if (! (driver instanceof expressway.Provider)) {
            driver = expressway.Provider.get(driver);
        }
        driver.load(app);

        logger.debug('[Driver] Using: %s', driver.name);
    }
}

module.exports = new DriverProvider();