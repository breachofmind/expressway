"use strict";

var Controller = require('../../index').Controller;

Controller.create('authController', function(controller,app)
{
    return {
        /**
         * GET /login
         *
         * Display the login form.
         */
        login: function(request,response)
        {
            if (request.user) {
                response.redirect('/');
            }
            return response.view('login').set('title',"Login");
        },

        /**
         * GET /logout
         *
         * Logs a user out and redirects to the login page.
         */
        logout: function(request,response)
        {
            request.logout();
            response.redirect('/login');
        },

        /**
         * POST /login
         *
         * Authenticates a username and password.
         * POSTing as ajax will return a response in JSON format.
         */
        authenticate: function(request,response,next)
        {
            var isAjax = request.ajax;

            app.passport.authenticate('local', function(err,user,info)
            {
                if (err) return next(err);

                if (! user) {
                    return isAjax ? response.smart({success:false, error:info.message}, 401) : response.view('login');
                }

                request.logIn(user, function(err) {

                    if (err) {
                        return isAjax ? response.smart({success:false, error:info.message}, 401) : response.view('login');
                    }

                    return isAjax ? response.smart({success:true, user:user, redirect:"/admin"}, 200) : response.redirect('/');
                });

            })(request,response,next);

            return true;
        },
    }
});