"use strict";

var Expressway = require('expressway');

class LocaleController extends Expressway.Controller
{
    constructor(app)
    {
        super();

        this.cacheResponses = app.env === ENV_PROD;
    }

    index(request,response,next,localeService)
    {
        if (this.cacheResponses) {
            response.setHeader('Cache-Control', 'public, max-age=' + 7*24*60*60);
        }
        var locale = request.locale.toLowerCase();

        return {
            locale: locale,
            keys: localeService.getLocale(locale)
        };
    }
}

module.exports = LocaleController;