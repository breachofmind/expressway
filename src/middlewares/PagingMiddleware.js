"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;

class ModelPagingMiddleware extends Expressway.Middleware
{
    method(request,response,next)
    {
        if (request.query.p) {
            request.query.filter = request.Model.paging( utils.fromBase64(request.query.p) );
        }

        return next();
    }
}

module.exports = ModelPagingMiddleware;

