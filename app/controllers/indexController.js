"use strict";
var Controller = require('../../index').Controller;

module.exports = Controller.create('indexController', function(app)
{
    var globals = {
        variable: "Hello, World"
    };

    // Add middleware to controller methods.
    // This will add middleware to all methods.
    this.middleware(function(request,response,next) {
        next();
    });

    // This will add middleware to a single method.
    this.middleware('index', 'indexController.test');


    // Return your controller methods here.
    return {
        index: function(request,response,next) {
            return response.view('index').use(globals);
        },

        test: function(request,response,next) {
            next();
        }
    }
});