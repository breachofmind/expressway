"use strict";

var Controller = require('../../index').Controller;

Controller.create('authController', function(controller)
{
    return {
        login: function(request,response)
        {
            if (request.user) {
                response.redirect('/');
            }
            return response.view('login').set('title',"Login");
        },

        logout: function(request,response)
        {
            request.logout();
            response.redirect('/login');
        }
    }
});