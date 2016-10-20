"use strict";

var Expressway = require('expressway');

class AjaxMiddleware extends Expressway.Middleware
{
    dispatch(request,response,next)
    {
        request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
        next();
    }
}

module.exports = AjaxMiddleware;

