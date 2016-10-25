"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var locale = require('locale');
var http = require('http');

class LocaleMiddleware extends Expressway.Middleware
{
    /**
     * Checks for the ?cc query and attaches a
     * helper method to the request object.
     * @param request
     * @param response
     * @param next
     */
    method(request,response,next)
    {
        if (request.query.cc) {
            request.locale = request.query.cc.toLowerCase();
        }
        next();
    }

    /**
     * Load into express, if using globally.
     * @param $app Express
     * @param localeService LocaleService
     * @param config Function
     */
    boot($app,localeService,config)
    {
        http.IncomingMessage.prototype.lang = function(key,args)
        {
            var loc = this.locale.toLowerCase();
            if (! key || key=="") return "";
            if (! loc) loc = "en_us";
            return localeService.getKey(loc,key,args);
        };

        $app.use(function LocaleParser(...args) {
            return locale( config('lang_support', ['en_us']))(...args);
        });
        super.boot($app);
    }
}



module.exports = LocaleMiddleware;

