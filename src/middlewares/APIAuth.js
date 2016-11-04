"use strict";

var Expressway = require('expressway');

class APIAuth extends Expressway.Middleware
{
    method(request,response,next)
    {
        if (! request.user) {
            return response.api({error:`You are not authorized to perform this operation`}, 401);
        }
        return next();
    }
}

module.exports = APIAuth;