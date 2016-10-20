"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var locale = require('locale');
var localeService = app.get('localeService');

class LocaleMiddleware extends Expressway.Middleware
{
    dispatch(request,response,next)
    {
        if (request.query.cc) {
            request.locale = request.query.cc.toLowerCase();
        }
        request.lang = localeService.helper(request);

        next();
    }

    /**
     * Load into express, if using globally.
     * @param express
     */
    load(express)
    {
        express.use(locale( app.conf('lang_support', ['en_us'])) );
        super.load(express);
    }
}

module.exports = LocaleMiddleware;

