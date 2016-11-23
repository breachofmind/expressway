"use strict";

var Expressway = require('expressway');

class Ajax extends Expressway.Middleware
{
    get description() {
        return "Checks if the X-Requested-With request header is XMLHttpRequest and sets request.ajax = true|false";
    }
    method(request,response,next)
    {
        request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
        next();
    }
}

module.exports = Ajax;

