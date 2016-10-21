"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var locale = require('locale');

class LocaleMiddleware extends Expressway.Middleware
{
    /**
     * Checks for the ?cc query and attaches a
     * helper method to the request object.
     * @param request
     * @param response
     * @param next
     * @param localeService LocaleService
     */
    method(request,response,next,localeService)
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
    boot(express)
    {
        express.use(locale( app.conf('lang_support', ['en_us'])) );
        super.boot(express);
    }
}

module.exports = LocaleMiddleware;

