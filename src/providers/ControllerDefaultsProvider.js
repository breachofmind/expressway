"use strict";

var Expressway = require('expressway');

/**
 * Provides some defaults for controllers.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerDefaultsProvider extends Expressway.Provider
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.order = 0;

        this.requires = [
            'ControllerProvider',
            'LocaleProvider',
            'AuthProvider',
            'CoreProvider'
        ];

        this.RESTController = {
            requireUser : true, // Require logged in user to create/delete/update?
            middleware  : null,
            routes: function(router)
            {
                router.get({
                    '/api/v1'               : 'RESTController.index',
                    '/api/v1/:model'        : 'RESTController.fetchAll',
                    '/api/v1/:model/:id'    : 'RESTController.fetchOne'
                }).post({
                    '/api/v1/:model'        : 'RESTController.create',
                    '/api/v1/:model/search' : 'RESTController.search'
                }).put({
                    '/api/v1/:model/:id'    : 'RESTController.update'
                }).delete({
                    '/api/v1/:model/:id'    : 'RESTController.trash'
                });
            }
        };

        this.LocaleController = {
            middleware: null,
            routes: function(router)
            {
                router.get({
                    '/api/v1/locale' : 'LocaleController.index',
                })
            }
        };

        this.AuthController = {
            routes: function(router)
            {
                router.get({
                    '/login'                : 'AuthController.login',
                    '/logout'               : 'AuthController.logout',
                    '/login/reset'          : 'AuthController.forgot',
                    '/login/reset/:hash'    : 'AuthController.lookup',
                }).post({
                    '/login'                : 'AuthController.authenticate',
                    '/login/reset'          : 'AuthController.request_reset',
                    '/login/reset/:hash'    : 'AuthController.perform_reset',
                });
            }
        }
    }

    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        app.register('ControllerDefaultsProvider', this, "Controller Defaults Provider instance");

        app.register('DefaultRESTController',   require('../controllers/RESTController'), "The default REST Controller class");
        app.register('DefaultLocaleController', require('../controllers/LocaleController'), "The default Locale Controller class");
        app.register('DefaultAuthController',   require('../controllers/AuthController'), "The default Auth Controller class");
    }
}

module.exports = ControllerDefaultsProvider;