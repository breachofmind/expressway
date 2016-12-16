"use strict";

var Expressway = require('expressway');
var csrf = require('csurf');

class CSRF extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Provides Cross-site Request Forgery (CSRF) protection via csurf";
    }

    constructor()
    {
        super();

        this.options = {};
    }

    dispatch()
    {
        let middleware = csrf(this.options);

        return function CSRF()
        {
            return middleware(...arguments);
        };
    }
}

module.exports = CSRF;