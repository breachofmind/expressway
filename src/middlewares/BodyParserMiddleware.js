"use strict";

var Expressway = require('expressway');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

class BodyParserMiddleware extends Expressway.Middleware
{
    constructor() { super() }

    /**
     * Load into express, if using globally.
     * @param express
     * @param app Application
     */
    load(express,app)
    {
        express.use(bodyParser.json());
        express.use(bodyParser.urlencoded({extended:true}));
        express.use(cookieParser(app.conf('appKey', "keyboard cat")));
    }
}

module.exports = BodyParserMiddleware;

