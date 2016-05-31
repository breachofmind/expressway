"use strict";

var Controller = require('../../index').Controller;

Controller.create('authController', function(controller)
{
    return {
        login: function(request,response)
        {
            return request.view('login').set('title',"Login");
        },

        logout: function(request,response)
        {
            request.logout();
            response.redirect('/login');
        }
    }
});