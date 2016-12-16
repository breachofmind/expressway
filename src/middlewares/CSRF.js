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
        let errorHandler = function CSRFError (err,req,res,next) {
            if (err.code !== 'EBADCSRFTOKEN') return next(err);
            return res.sendStatus(403);
        };
        return [
            function CSRF() {
                return middleware(...arguments);
            },
            errorHandler
        ];
    }
}

module.exports = CSRF;