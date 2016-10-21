"use strict";

var Expressway = require('expressway');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = Expressway.instance.app;

class BodyParserMiddleware extends Expressway.Middleware
{
    /**
     * Load into express, if using globally.
     * @param express
     */
    boot(express)
    {
        express.use(bodyParser.json());
        express.use(bodyParser.urlencoded({extended:true}));
        express.use(cookieParser(app.conf('appKey', "keyboard cat")));
    }
}

module.exports = BodyParserMiddleware;

