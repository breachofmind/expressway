"use strict";

var Provider = require('../provider');
var restController = require('../controllers/restController'),
    localeController = require('../controllers/langController');


/**
 * Provides some defaults for controllers.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ControllerDefaultsProvider extends Provider
{
    constructor()
    {
        super('controllerDefaults');

        this.requires([
            'controller',
            'locale',
            'url'
        ]);

        this.REST = {
            // Require logged in user to create/delete/update?
            requireUser: true,
            controller: restController,
            middleware: null,
            routes: function(router)
            {
                router.get({
                    '/api/v1'               : 'restController.index',
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
            }
        };

        this.Locales = {
            controller: localeController,
            middleware: null,
            routes: function(router)
            {
                router.get({
                    '/api/v1/lang' : 'langController.index',
                })
            }
        };


    }
}

module.exports = new ControllerDefaultsProvider();