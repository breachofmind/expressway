"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var config = app.get('config');

/**
 * Manipulates a search for models, given the logged in user.
 * This middleware should provide the rules of a user's search.
 * ie. One user can only see items they own, other users can see all items.
 */
class ModelSearch extends Expressway.Middleware
{
    method(request,response,next)
    {
        let search = request.body;
        let model = request.params.model;

        request.params.query = model
            .find(search.where)
            .sort(search.sort)
            .limit(search.limit || config('limit',50))
            .populate(search.populate || model.populate);

        // Based on permissions, only show models the user owns.
        if(request.user.cannot(model,'manage')) {
            request.params.query.where(model.managed).equals(request.user.id);
        }

        next();
    }
}

module.exports = ModelSearch;

