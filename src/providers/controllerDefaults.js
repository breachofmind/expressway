"use strict";

var expressway = require('expressway');

/**
 * Provides some defaults for controllers.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerDefaultsProvider extends expressway.Provider
{
    constructor()
    {
        super();

        this.order = 0;

        this.requires = [
            'ControllerProvider',
            'LocaleProvider',
            'URLProvider'
        ];

        this.inject = ['ControllerProvider'];

        this.RESTController = {
            // Require logged in user to create/delete/update?
            requireUser: true,
            middleware: null,
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
                    '/api/v1/lang' : 'LocaleController.index',
                })
            }
        };
    }

    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        app.register('ControllerDefaultsProvider', this);
        app.register('DefaultRESTController', require('../controllers/RESTController')(this));
        app.register('DefaultLocaleController', require('../controllers/LocaleController')(this));
    }
}

module.exports = new ControllerDefaultsProvider();