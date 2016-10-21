"use strict";

var Expressway = require('expressway');

class AjaxMiddleware extends Expressway.Middleware
{
    method(request,response,next)
    {
        request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
        next();
    }
}

module.exports = AjaxMiddleware;

