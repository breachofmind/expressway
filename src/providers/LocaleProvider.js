"use strict";

var Expressway = require('expressway');

/**
 * Provides Locale support.
 * @author Mike Adamczyk <mike@bom.us>
 */
class LocaleProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires('ControllerProvider');
    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        app.singleton('localeService', require('../services/LocaleService'), "Service for adding/retrieving locale keys");

        app.register('LocaleController',require('../controllers/LocaleController'), "The default Locale controller");

        // When each view is created, add the template function.
        app.on('view.created', function(view,request) {
            view.data.lang = request.lang.bind(request);
        });
    }

    /**
     * When all providers loaded, add the default locale path.
     * @param localeService
     * @param path
     */
    boot(localeService,path)
    {
        localeService.addLocaleDir(path.locales('/'));
    }
}

module.exports = LocaleProvider;