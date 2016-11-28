"use strict";

var Expressway = require('expressway');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = Expressway.app;
var config = app.get('config');

class BodyParser extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Parses the request body and cookie headers with bodyParser and cookieParser";
    }

    dispatch()
    {
        var bodyParseJson  = bodyParser.json();
        var bodyParseUrl   = bodyParser.urlencoded({extended:true});
        var cookieParse    = cookieParser(config('appKey', "keyboard cat"));

        return [
            function BodyParserJSON(...args) {
                return bodyParseJson(...args);
            },
            function BodyParserURLEncoded(...args) {
                return bodyParseUrl(...args);
            },
            function CookieParser(...args) {
                return cookieParse(...args);
            }
        ]
    }
}

module.exports = BodyParser;

