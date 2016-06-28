/**
 * Provides some routes for the application.
 * @param app Application
 * @param router Express
 * @param dispatch function
 */
module.exports = function(app,router,dispatch)
{
    var passport = app.passport;

    // Authentication routes.
    router.get  ('/login',  dispatch('authController', 'login'));
    router.get  ('/logout', dispatch('authController', 'logout'));
    router.post ('/login',  passport.authenticate('local', {
        successRedirect: "/",
        failureRedirect: "/login"
    }));

    // RESTful api
    router.get      ('/api/v1',            dispatch('restController','index'));
    router.get      ('/api/v1/lang',       dispatch('langController','index'));
    router.get      ('/api/v1/:model',     dispatch('restController','fetchAll'));
    router.post     ('/api/v1/:model',     dispatch('restController','create'));
    router.get      ('/api/v1/:model/:id', dispatch('restController','fetchOne'));
    router.put      ('/api/v1/:model/:id', dispatch('restController','update'));
    router.delete   ('/api/v1/:model/:id', dispatch('restController','trash'));


    // Application routes.
    router.get('/',      dispatch('indexController','index'));
};