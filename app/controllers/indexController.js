"use strict";

var Controller = require('../../index').Controller;

Controller.create('indexController', function(controller)
{
    return {
        index: function(request,response)
        {
            return request.view('index');
        }
    }
});