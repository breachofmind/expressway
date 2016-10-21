"use strict";

var Expressway = require('expressway');

class ModelRequestMiddleware extends Expressway.Middleware
{
    method(request,response,next,modelService)
    {
        var value = request.params.model;
        var Model = modelService.bySlug(value);

        if (! Model) {
            return response.api({error:`Model "${value}" doesn't exist.`}, 404);
        }

        if (Model.expose == false && ! request.user) {
            return response.api({error:`You must be logged in to view "${Model.name}" models`}, 401);
        }

        request.Model = Model;

        return next();
    }
}

module.exports = ModelRequestMiddleware;

