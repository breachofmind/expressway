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
     * @param ExpressProvider ExpressProvider
     */
    register(app, ExpressProvider)
    {
        var Localization = require('./classes/Localization');

        var localization = new Localization();

        app.register('localization', localization);

        // When each view is created, add the template function.
        app.event.on('view.created', function(view,request) {
            view.data.lang = localization.helper(request);
        });

        ExpressProvider.middlewareStack.add('Localization', function (app,server)
        {
            server.use(localization.middleware);
        });
    }
}

module.exports = LocaleProvider;