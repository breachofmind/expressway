"use strict";

var Controller = require('../../index').Controller;

Controller.create('indexController', function(app)
{
    // Specify your global variables or controller bindings up here.
    // These should not change for each request.
    var globals = {
        message: "Enjoy yourself"
    };

    // Return your controller methods here.
    return {
        index: function(request,response)
        {
            return response.view('index').and(globals);
        }
    }

});