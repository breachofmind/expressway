"use strict";

module.exports = function(Factory)
{
    return Factory.create('authController', function(app)
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
                if (request.user) {
                    app.logger.access('User logging out: %s', request.user.id);
                }
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
                        return response.smart(isAjax ? {success:false, error:info.message} : response.view('login'), 401);
                    }

                    request.logIn(user, function(err) {

                        if (err) {
                            return response.smart(isAjax ? {success:false, error:info.message} : response.view('login'), 401);
                        }

                        return response.smart(isAjax ? {success:true, user:user, redirect:"/admin"} : response.redirect('/'), 200);
                    });

                })(request,response,next);

                return true;
            },
        }
    });
}

