"use strict";

var Expressway = require('expressway');
var app = Expressway.app;
var locale = require('locale');
var http = require('http');
var [localeService,config] = app.get('localeService','config');

class Localization extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Finds the requester's locale and adds some localization functionality";
    }
    dispatch()
    {
        http.IncomingMessage.prototype.lang = function(key,args)
        {
            var loc = this.locale.toLowerCase();
            if (! key || key=="") return "";
            if (! loc) loc = "en_us";
            return localeService.getKey(loc,key,args);
        };

        var middleware = locale( config('lang_support', ['en_us']));

        return [
            function LocaleParser(...args) {
                return middleware(...args);
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

