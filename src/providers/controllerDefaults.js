"use strict";

var restController = require('../controllers/restController'),
    localeController = require('../controllers/langController');

/**
 * Provides some defaults for controllers.
 * @author Mike Adamczyk <mike@bom.us>
 * @param Provider
 */
module.exports = function(Provider)
{
    Provider.create('controllerDefaultsProvider', function() {

        this.requires([
            'controllerProvider',
            'urlProvider'
        ]);

        this.REST = {
            controller: restController,
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
            routes: function(router)
            {
                router.get({
                    '/api/v1/lang' : 'langController.index',
                })
            }
        };

        return function() {};
    });
};


