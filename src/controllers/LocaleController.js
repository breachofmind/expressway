"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;

class LocaleController extends Expressway.Controller
{
    constructor()
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

LocaleController.routes = {
    'GET /locale' : 'LocaleController.index',
};

module.exports = LocaleController;