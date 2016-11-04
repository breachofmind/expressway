"use strict";

var Expressway = require('expressway');

class AuthController extends Expressway.Controller
{
    constructor(app)
    {
        super(app);

        this.loginURI = "/auth/login";
        this.forgotURI = "/auth/login/reset";
        this.successURI = "/";

        this.middleware('CSRF');
    }

    /**
     * GET /login
     *
     * Display the login form.
     */
    login(request,response,next,view)
    {
        if (request.user) {
            response.redirect(this.successURI);
        }
        var flash = request.flash('message');

        return view('auth/login')
            .set({title: "Login"})
            .use({message: flash[0] || "", username:request.query.username || ""});
    }

    /**
     * GET /login/reset
     *
     * For when user forgets their password.
     */
    forgot(request,response,next,view)
    {
        var flash = request.flash('message');

        return view('auth/forgot')
            .set({title: "Reset Password"})
            .use({message: flash[0] || ""});
    }

    /**
     * GET /login/reset/:hash
     *
     * Look up a user's reset token.
     */
    lookup(request,response,next,User,view)
    {
        return User.findOne({reset_token: request.params.hash}).exec().then(user => {
            if (! user) {
                return next();
            }
            return view('auth/reset', {requester: user});
        })
    }

    /**
     * POST /login/reset
     *
     * Allows the user to securely reset their password.
     */
    request_reset(request,response,next, User,encrypt,url,log,mail,app,domain)
    {
        return User.findOne({email: request.body.username}).exec().then(user =>
        {
            // If no user found,
            // return to the login screen with a message.
            if (! user) {
                return response.redirectWithFlash(this.loginURI, 'message', {
                    text: request.lang('auth.err_user_missing'),
                    type: 'alert'
                });
            }

            // Generate a reset link.
            var hash = encrypt(user.email, Date.now().toString());
            user.reset_token = hash;
            user.save();

            var resetLink = url(`${this.forgotURI}/${hash}`);

            mail({
                from:    `Administrator <${app.conf('admin_email', 'info@'+domain)}>`,
                to:      user.email,
                subject: 'Password Reset',
                view:    'email/reset',
                data:    {resetLink: resetLink}
            })
                .then(info => {
                    log.access('Mail sent: User requested reset: %s %s', user.id, app.config.debug ? resetLink : "");
                    if (app.config.debug) {
                        console.log(info.response.toString());
                    }
                });

            request.flash('message', {
                text: request.lang('auth.login_reset'),
                type: 'success'
            });

            return response.redirect(this.forgotURI)
        });
    }

    /**
     * POST /login/reset/:hash
     *
     * Given the reset token, change the user's password.
     */
    perform_reset(request,response,next, User, encrypt)
    {
        var newPassword = request.body.password;

        if (! newPassword || newPassword == "") {
            return response.redirectWithFlash(this.loginURI, 'message', {
                success: false,
                text: request.lang('auth.err_no_password'),
                type: 'alert'
            });
        }
        return User.findOne({reset_token: request.params.hash}).exec().then(user =>
        {
            // If no user found,
            // return to the login screen with a message.
            if (! user) {
                return response.redirectWithFlash(this.loginURI, 'message', {
                    success: false,
                    text: request.lang('auth.err_user_missing'),
                    type: 'alert'
                });
            }

            return user.update({password: request.body.password}).then(result => {
                user.reset_token = "";
                user.save();
                return response.redirectWithFlash(this.loginURI+"?username="+user.email, 'message', {
                    text: request.lang('auth.password_reset'),
                    type: 'success'
                });
            }, err => {
                return response.redirectWithFlash(this.loginURI, 'message', {
                    success: false,
                    text: request.lang('auth.'+err.message),
                    type: 'alert'
                });
            });
        })
    }

    /**
     * GET /logout
     *
     * Logs a user out and redirects to the login page.
     */
    logout(request,response,next,log)
    {
        if (request.user) {
            log.access('User logging out: %s', request.user.id);
        }
        request.logout();

        return response.redirectWithFlash(this.loginURI, 'message', {
            text: request.lang('auth.logged_out'),
            type:'success'
        });
    }

    /**
     * POST /login
     *
     * Authenticates a username and password.
     * POSTing as ajax will return a response in JSON format.
     */
    authenticate(request,response,next,passport)
    {
        var opts = {badRequestMessage: 'auth.err_missing_credentials'};

        // Fires if there was an error...
        var kill = info =>
        {
            return response.redirectWithFlash(this.loginURI, 'message', {
                success: false,
                text:    request.lang(info.message),
                type:    'alert'
            });
        };

        // Use passport to authenticate.
        // Messages are returned in locale format.
        passport.authenticate('local', opts, (err,user,info) =>
        {
            if (err) return next(err);

            if (! user) return kill(info);

            request.logIn(user, err =>
            {
                if (err) return kill(info);

                return request.ajax
                    ? response.smart({success:true, user:user, redirect:this.successURI}, 200)
                    : response.redirect(this.successURI);
            });

        })(request,response,next);

        return true;
    }
}

AuthController.routes = {
    'GET  /login'                : 'AuthController.login',
    'GET  /logout'               : 'AuthController.logout',
    'GET  /login/reset'          : 'AuthController.forgot',
    'GET  /login/reset/:hash'    : 'AuthController.lookup',
    'POST /login'                : 'AuthController.authenticate',
    'POST /login/reset'          : 'AuthController.request_reset',
    'POST /login/reset/:hash'    : 'AuthController.perform_reset',
};

module.exports = AuthController;