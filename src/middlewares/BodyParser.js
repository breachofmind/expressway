"use strict";

var Expressway = require('expressway');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = Expressway.app;
var config = app.get('config');

class BodyParser extends Expressway.Middleware
{
    dispatch()
    {
        return [
            function BodyParserJSON(...args) {
                return bodyParser.json()(...args);
            },
            function BodyParserURLEncoded(...args) {
                return bodyParser.urlencoded({extended:true})(...args);
            },
            function CookieParser(...args) {
                return cookieParser(config('appKey', "keyboard cat"))(...args);
            }
        ]
    }
}

module.exports = BodyParser;

