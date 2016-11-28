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

        // When each view is created, add the template function.
        app.on('view.created', function(view,request) {
            view.data.lang = request.lang.bind(request);
        });
    }

    /**
     * When all providers loaded, add the default locale path.
     * @param app Application
     * @param localeService LocaleService
     * @param path PathService
     * @param config Function
     */
    boot(app,localeService,path,config)
    {
        // Add a route to the api that returns the locale keys.
        if (app.loaded('APIModule'))
        {
            app.get('APIModule').add({
                "GET /locale" : function(request,response)
                {
                    if (app.config.cache) {
                        response.setHeader('Cache-Control', 'public, max-age=' + config('cache_max_age', 7*24*60*60));
                    }
                    var locale = request.locale.toLowerCase();

                    return {
                        locale: locale,
                        keys: localeService.getLocale(locale)
                    };
                }
            })
        }
    }
}

module.exports = LocaleProvider;