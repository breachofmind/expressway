"use strict";

var expressway = require('expressway');

module.exports = function(ControllerDefaultsProvider)
{
    return class LocaleController extends expressway.Controller
    {
        constructor(app)
        {
            super(app);

            this.localization = app.get('Localization');
            this.cacheResponses = app.env === ENV_PROD;
        }

        index(request,response)
        {
            if (this.cacheResponses) {
                response.setHeader('Cache-Control', 'public, max-age=' + 7*24*60*60);
            }
            var locale = request.locale.toLowerCase();

            return {
                locale: locale,
                keys: this.localization.getLocale(locale)
            };
        }
    }
};