"use strict";

var _ = require('lodash');

/**
 * Maintained controller that does basic CRUD and REST stuff.
 * @param app
 * @returns {object}
 */
module.exports = function(app)
{
    var Model = app.ModelFactory;
    var utils = app.utils;

    /**
     * Assign the route middleware.
     */
    this.middleware({
        update : apiAuthMiddleware,
        create : apiAuthMiddleware,
        trash  : apiAuthMiddleware
    });

    /**
     * Assign global middleware.
     */
    this.middleware(modelMiddleware);

    /**
     * Resolve the id of the model with the object.
     */
    this.bind('id', function(value,request)
    {
        if (request.Model && value) {
            request.Object = request.Model.findOne({_id: value});
        }
    });

    this.query('p', function(value,request)
    {
        request.query.filter = request.blueprint.paging(utils.fromBase64(value));
    });


    /**
     * Special middleware to check if this is a model being requested.
     * @param request
     * @param response
     * @param next
     */
    function modelMiddleware(request,response,next)
    {
        if (! request.params.hasOwnProperty('model')) {
            return next();
        }
        var value = request.params.model;
        var blueprint = Model.get(value);

        if (! blueprint) {
            return response.api({error:`Model "${value}" doesn't exist.`}, 404);
        }

        if (blueprint.expose == false && ! request.user) {
            return response.api({error:`You must be logged in to view "${value}" models.`}, 401);
        }


        request.Model = blueprint.model;
        request.blueprint = blueprint;
        return next();
    }

    /**
     * Special middleware for certain routes on this controller.
     * @param request
     * @param response
     * @param next
     */
    function apiAuthMiddleware (request,response,next)
    {
        if (! request.user) {
            return response.api({error:`You are not authorized to perform this operation.`}, 401);
        }
        next(request);
    }



    return {

        /**
         * Say Hello.
         *
         * GET /api/v1/
         */
        index: function(request,response)
        {
            var blueprints = Model.all();
            var json = {
                message: "Express MVC API v1",
                currentUser: request.user,
                index: {}
            };
            Object.keys(blueprints).forEach(function(slug) {
                if (blueprints[slug].expose == false && request.user) {
                    json.index[blueprints[slug].name] = app.url('api/v1/'+slug);
                }
            });
            app.event.emit('rest.index', json.index);

            return json;
        },

        /**
         * Fetches an object by ID.
         *
         * GET /api/v1/{model}/{id}
         */
        fetchOne: function(request,response)
        {
            return request.Object.populate(request.blueprint.populate).exec().then(function(data) {

                return response.api(data,200,{
                    labels: request.blueprint.labels,
                    model: request.blueprint.name
                });

            }, function(err) {

                return response.api({error:err},400);
            })
        },

        /**
         * Fetches an array of objects, with pagination.
         *
         * GET /api/v1/{model}
         */
        fetchAll: function(request,response)
        {
            var paging = {
                count:      0,
                total:      0,
                limit:      app.config.limit || 10000,
                filter:     request.getQuery('filter', null),
                sort:       request.getQuery('sort', request.blueprint.range),
                next:       null
            };
            /**
             * Sets up the paging object with the next URL string.
             * @param data array
             * @returns object
             */
            paging.setNext = function(data)
            {
                if (data.length) {
                    var lastValue = data[data.length-1][request.blueprint.key];
                }
                this.count = data.length;
                this.next = this.total > this.limit
                    ? utils.toBase64(lastValue.toString())
                    : null;

                return this;
            };

            // Find the total record count first, then find the range.
            return request.Model.count(paging.filter).exec().then(function(count) {

                paging.total = count;

                var promise = request.Model
                    .find       (paging.filter)
                    .sort       (paging.sort)
                    .limit      (paging.limit)
                    .populate   (request.blueprint.populate)
                    .exec();

                // After finding the count, find the records.
                return promise.then(function(data) {

                    paging.setNext(data);

                    return response.api(data,200, {
                        pagination: paging,
                        labels: request.blueprint.labels,
                        model: request.blueprint.name
                    });

                }, function(err) {

                    // Model.find() error
                    return response.api({error:err},400);
                });

            }, function(err) {

                // Model.count() error
                return response.api({error:err},400);
            });
        },

        /**
         * Initiate a new search.
         *
         * POST /api/{model}/search
         */
        search: function(request,response)
        {
            var search = request.body;

            var promise = request.Model
                .find(search.where)
                .sort(search.sort)
                .limit(search.limit || app.config.limit)
                .populate(request.blueprint.populate)
                .exec();

            return promise.then(function(data)
            {
                return response.api(data,200);

            }, function(err) {

                return response.api({error:err},400);
            });
        },

        /**
         * Update a model.
         *
         * PUT /api/{model}/{id}
         */
        update: function(request,response)
        {
            if (request.body._id) delete request.body._id; // Mongoose has problems with this.

            request.body.modified_at = Date.now();

            return request.Model
                .findByIdAndUpdate(request.params.id, request.body, {new:true})
                .populate(request.blueprint.populate)
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
            var model = new request.Model (request.body);

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
            return request.Model.remove({_id:request.params.id}).then(function(results) {
                var data = {
                    results: results,
                    objectId : request.params.id
                };
                return response.api(data,200);

            }, function(err) {

                return response.api({error:err},400);

            });
        }

    }
};