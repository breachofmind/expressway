"use strict";

var Expressway = require('expressway');

class Init extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Runs at the start of all requests";
    }

    method(request,response,next)
    {
        response.viewData = [];
        next();
    }
}

module.exports = Init;

