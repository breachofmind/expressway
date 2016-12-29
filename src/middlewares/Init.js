"use strict";

var Middleware = require('expressway').Middleware;
var View = require('../View');

class Init extends Middleware
{
    get description() {
        return "Runs at the start of all requests";
    }

    dispatch(extension)
    {
        function Init(request,response,next) {
            response.view = new View(extension,request,response);
            next();
        }

        return Init;
    }
}

module.exports = Init;