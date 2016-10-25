"use strict";

var Expressway = require('expressway');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

class BodyParserMiddleware extends Expressway.Middleware
{
    /**
     * Load into express, if using globally.
     * @param $app Express
     * @param config function
     */
    boot($app,config)
    {
        $app.use(function BodyParserJSON(...args) {
            return bodyParser.json()(...args);
        });
        $app.use(function BodyParserURLEncoded(...args) {
            return bodyParser.urlencoded({extended:true})(...args);
        });
        $app.use(function CookieParser(...args) {
            return cookieParser(config('appKey', "keyboard cat"))(...args);
        });
    }
}

module.exports = BodyParserMiddleware;

