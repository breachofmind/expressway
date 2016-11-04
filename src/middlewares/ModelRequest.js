"use strict";

var Expressway = require('expressway');

class ModelRequest extends Expressway.Middleware
{
    method(request,response,next,modelService)
    {
        var value = request.params.model;
        var model = modelService.bySlug(value);

        if (! model) {
            return response.api({error:`Model "${value}" doesn't exist.`}, 404);
        }

        if (model.expose == false && ! request.user) {
            return response.api({error:`You must be logged in to view "${model.name}" models`}, 401);
        }

        request.params.model = model;

        return next();
    }
}

module.exports = ModelRequest;

