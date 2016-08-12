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

    var defaults = app.get('controllerDefaultsProvider');

    defaults.REST.routes(this);
    defaults.Locales.routes(this);

    // Application routes.
    this.get({
        '/' : 'indexController.index'
    });
};