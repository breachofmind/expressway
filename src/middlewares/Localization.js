"use strict";

var Expressway = require('expressway');
var app = Expressway.app;
var locale = require('locale');
var http = require('http');
var [localeService,config] = app.get('localeService','config');

class Localization extends Expressway.Middleware
{
    dispatch()
    {
        http.IncomingMessage.prototype.lang = function(key,args)
        {
            var loc = this.locale.toLowerCase();
            if (! key || key=="") return "";
            if (! loc) loc = "en_us";
            return localeService.getKey(loc,key,args);
        };

        return [
            function LocaleParser(...args) {
                return locale( config('lang_support', ['en_us']))(...args);
            },
            function LocaleQuery(request,response,next) {
                if (request.query.cc) {
                    request.locale = request.query.cc.toLowerCase();
                }
                next();
            }
        ]
    }
}



module.exports = Localization;

