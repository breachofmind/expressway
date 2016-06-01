"use strict";

var Controller = require('../../index').Controller;

Controller.create('indexController', function(controller)
{
    // Specify your global variables or controller bindings up here.
    var globals = {
        message: "Enjoy yourself"
    };

    // Return your controller methods here.
    return {
        index: function(request,response)
        {
            return request.view('index').and(globals);
        }
    }
});