"use strict";

var Expressway = require('expressway');

class LocaleController extends Expressway.Controller
{
    constructor(app)
    {
        super(app, ['ControllerDefaultsProvider']);

        this.localization = app.get('localization');
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

module.exports = LocaleController;