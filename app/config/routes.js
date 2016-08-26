/**
 * Provides some routes for the application.
 */
module.exports = function(app,Template)
{
    // Authentication routes.
    this.get({
        '/login' : 'authController.login',
        '/logout': 'authController.logout'
    }).post({
        '/login' : 'authController.authenticate'
    });

    app.get('controllerDefaults').Locales.routes(this);
    app.get('controllerDefaults').REST.routes(this);


    // Application routes.
    this.get({
        '/' : 'indexController.index'
    });
};