"use strict";

var Middleware   = require('../Middleware');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');

class BodyParser extends Middleware
{
    get description() {
        return "Parses the request body and cookie headers with bodyParser and cookieParser";
    }

    dispatch(extension,config)
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