"use strict";

module.exports = function(Controller)
{
    return Controller.create('authController', function(app)
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
                return response.view('login').set('title',"Login").and({
                    message: request.flash('message') || null
                });
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
                request.flash('message', 'auth.logged_out');
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
                        request.flash('message', info.message);
                        return isAjax ? response.smart({success:false, error:info.message}) : response.redirect('/login');
                    }

                    request.logIn(user, function(err) {

                        if (err) {
                            request.flash('message', info.message);
                            return isAjax ? response.smart({success:false, error:info.message}) : response.redirect('/login');
                        }

                        return response.smart(isAjax ? {success:true, user:user, redirect:"/admin"} : response.redirect('/'), 200);
                    });

                })(request,response,next);

                return true;
            },
        }
    });
}

