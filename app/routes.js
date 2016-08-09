/**
 * Provides some routes for the application.
 */
module.exports = function()
{
    // Authentication routes.
    this.get({
        '/login' : 'authController.login',
        '/logout': 'authController.logout'
    }).post({
        '/login' : 'authController.authenticate'
    });

    // API routes.
    this.get({
        '/api/v1'               : 'restController.index',
        '/api/v1/lang'          : 'langController.index',
        '/api/v1/:model'        : 'restController.fetchAll',
        '/api/v1/:model/:id'    : 'restController.fetchOne'
    }).post({
        '/api/v1/:model'        : 'restController.create',
        '/api/v1/:model/search' : 'restController.search'
    }).put({
        '/api/v1/:model/:id'    : 'restController.update'
    }).delete({
        '/api/v1/:model/:id'    : 'restController.trash'
    });


    // Application routes.
    this.get({
        '/' : 'indexController.index'
    });
};