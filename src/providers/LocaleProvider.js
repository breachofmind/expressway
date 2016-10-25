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
            'ExpressProvider',
            'RouterProvider',
            'ControllerProvider',
        ];
    }

    /**
     * Register the provider with the application.
     * @param app Application
     */
    register(app)
    {
        // When each view is created, add the template function.
        app.event.on('view.created', function(view,request) {
            view.data.lang = request.lang.bind(request);
        });

        app.singleton('localeService', __dirname+'/../services/LocaleService', "Service for adding/retrieving locale keys");

        app.register('LocaleController',require('../controllers/LocaleController'), "The default Locale controller");
    }
}

module.exports = LocaleProvider;