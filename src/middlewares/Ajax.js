"use strict";

var Middleware = require('../Middleware');

class Ajax extends Middleware
{
    get description() {
        return "Checks if the X-Requested-With request header is XMLHttpRequest";
    }

    method(request,response,next)
    {
        request.ajax = request.get('x-requested-with') === 'XMLHttpRequest';
        next();
    }
}

module.exports = Ajax;