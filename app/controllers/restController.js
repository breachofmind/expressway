"use strict";
var ExpressMVC = require('../../index');

var Controller = ExpressMVC.Controller;
var Model = ExpressMVC.Model;
var Paginator = ExpressMVC.Paginator;

Controller.create('restController', function(controller)
{
    var Class,Object,blueprint;

    /**
     * Resolve the model parameter with the model class.
     */
    controller.bind('model', function(parameter,request,response)
    {
        blueprint = Model.get(parameter.toLowerCase());

        if (! blueprint || blueprint.expose == false) {
            return response.api({error:"Model does not exist."}, 404);
        }

        return Class = blueprint.model;
    });

    /**
     * Resolve the id of the model with the object.
     */
    controller.bind('id', function(parameter,request)
    {
        if (Class && parameter) {
            return Object = Class.findOne({_id: parameter}).exec();
        }
    });



    return {
        index: function(request,response)
        {
            return "Express MVC API v1";
        },

        /**
         * Fetches an object by ID.
         *
         * GET /api/{model}/{id}
         */
        fetchOne: function(request,response)
        {
            return Object.then(function(data) {

                return response.api(data,200);

            }, function(err) {

                return response.api(err,400);
            })
        },

        /**
         * Fetches an array of objects, with pagination.
         *
         * GET /api/{model}s
         */
        fetchAll: function(request,response)
        {
            return Paginator.make(blueprint,request,response).execute();
        },
    }
});