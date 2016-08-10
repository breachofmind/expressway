/**
 * Provides some routes for the application.
 */
module.exports = function(app,Template)
{
    Template.defaults = function(template){
        template.style('foundation', "https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation-flex.min.css");
    };

    // Authentication routes.
    this.get({
        '/login' : 'authController.login',
        '/logout': 'authController.logout'
    }).post({
        '/login' : 'authController.authenticate'
    });


    app.ControllerFactory.basic.Locales.routes(this);
    app.ControllerFactory.basic.REST.routes(this);


    // Application routes.
    this.get({
        '/' : 'indexController.index'
    });
};