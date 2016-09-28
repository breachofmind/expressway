"use strict";

var expressway = require('expressway');

module.exports = function(ControllerDefaultsProvider)
{
    return class LocaleController extends expressway.Controller
    {
        constructor(app)
        {
            super();
            this.inject = ['Localization'];

            this.cacheResponses = app.env === ENV_PROD;
        }

        methods(app,Localization)
        {
            var controller = this;

            return {
                index: function(request,response)
                {
                    if (controller.cacheResponses) {
                        response.setHeader('Cache-Control', 'public, max-age=' + 7*24*60*60);
                    }
                    var locale = request.locale.toLowerCase();

                    return {
                        locale: locale,
                        keys: Localization.getLocale(locale)
                    };
                }
            }
        }


    }
};