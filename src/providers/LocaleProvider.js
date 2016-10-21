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

        this.requires = [
            'LoggerProvider',
            'ViewProvider',
            'ExpressProvider'
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        var LocaleService = require('../services/LocaleService');

        var localeService = new LocaleService();

        app.register('localeService', localeService, "Service for adding/retrieving locale keys");

        // When each view is created, add the template function.
        app.event.on('view.created', function(view,request) {
            view.data.lang = request.lang.bind(request);
        });
    }
}

module.exports = LocaleProvider;