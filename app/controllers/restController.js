"use strict";
var ExpressMVC = require('../../index');

var Controller  = ExpressMVC.Controller;
var Model       = ExpressMVC.Model;
var Paginator   = ExpressMVC.Paginator;



Controller.create('restController', function(controller)
{
    var Class,Object,blueprint;

    /**
     * Resolve the model parameter with the model class.
     */
    controller.bind('model', function(value,request,response)
    {
        blueprint = Model.get(value.toLowerCase());

        if (! blueprint) {
            return response.api({error:`Model "${value}" doesn't exist.`}, 404);
        }

        if (blueprint.expose == false && ! request.user) {
            return response.api({error:`You must be logged in to view "${value}" models.`}, 401);
        }

        return Class = blueprint.model;
    });

    /**
     * Resolve the id of the model with the object.
     */
    controller.bind('id', function(value,request)
    {
        if (Class && value) {
            return Object = Class.findOne({_id: value}).exec();
        }
    });



    return {

        /**
         * Say Hello.
         *
         * GET /api/v1/
         */
        index: function(request,response)
        {
            return "Express MVC API v1";
        },

        /**
         * Fetches an object by ID.
         *
         * GET /api/v1/{model}/{id}
         */
        fetchOne: function(request,response)
        {
            return Object.then(function(data) {

                return response.api(data,200);

            }, function(err) {

                return response.api({error:err},400);
            })
        },

        /**
         * Fetches an array of objects, with pagination.
         *
         * GET /api/v1/{model}s
         */
        fetchAll: function(request,response)
        {
            return Paginator.make(blueprint,request,response).execute();
        },

        /**
         * Update a model.
         *
         * PUT /api/{model}/{id}
         */
        update: function(request,response)
        {
            if (request.body._id) delete request.body._id; // Mongoose has problems with this.

            if (! request.user) {

                return response.api({error:`You are not authorized to perform this operation.`}, 401);
            }

            request.body.modified_at = Date.now();

            return Class
                .findByIdAndUpdate(request.params.id, request.body, {new:true})
                .populate(params.model.population)
                .exec()
                .then(function(data) {

                    return response.api(data,200);

                }, function(err){

                    return response.api({error:err},400);
                });
        },

        /**
         * Create a new model.
         *
         * POST /api/{model}
         */
        create: function(request,response)
        {
            if (! request.user) {

                return response.api({error:`You are not authorized to perform this operation.`}, 401);
            }

            var model = new Class (request.body);

            return model.save().then(function(data)
            {
                return response.api(data,200);

            }, function(err) {

                return response.api({error:err},400);

            });
        },

        /**
         * Deletes an object by ID.
         *
         * DELETE /api/{model}/{id}
         */
        trash: function(request,response)
        {
            if (! request.user) {

                return response.api({error:`You are not authorized to perform this operation.`}, 401);
            }

            return params.Model.remove({_id:params.id}).then(function(results) {
                var data = {
                    results: results,
                    objectId : params.id
                };
                return response.api(data,200);

            }, function(err) {

                return response.api({error:err},400);

            });
        }

    }
});