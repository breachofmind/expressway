"use strict";

var Middleware = require('expressway').Middleware;
var csrf = require('csurf');

class CSRF extends Middleware
{
    get description() {
        return "Provides Cross-site Request Forgery (CSRF) protection via csurf";
    }

    constructor()
    {
        super();

        this.options = {};
    }

    /**
     * Dispatch the middleware functions to express.
     * @returns {[Function,Function]}
     */
    dispatch(extension)
    {
        let middleware = csrf(this.options);
        return [
            function CSRF(request,response,next) {
                return middleware(...arguments);
            },
            function CSRFError (err,request,response,next) {
                if (err.code !== 'EBADCSRFTOKEN') {
                    response.view.meta('_csrf', request.csrfToken(), {id:"CSRFTOKEN"});
                    return next(err);
                }
                return response.sendStatus(403);
            }
        ];
    }
}

module.exports = CSRF;