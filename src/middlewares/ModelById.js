"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;

class ModelById extends Expressway.Middleware
{
    method(request,response,next)
    {
        let id    = request.params.id;
        let model = request.params.model;

        model.findById(id).exec().then(result => {
            if (! result) {
                return response.api({error:`Model ${model.name}/${id} doesn't exist.`}, 404);
            }
            request.params.object = result;
            next();

        }, err => {
            response.apiError(err);
        });
    }
}

module.exports = ModelById;

