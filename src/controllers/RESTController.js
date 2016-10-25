"use strict";

var _           = require('lodash');
var Expressway  = require('expressway');
var utils       = Expressway.utils;

class RESTController extends Expressway.Controller
{
    constructor(app, modelService)
    {
        super(app);

        function idBinding(request,response,next) {
            if (request.Model && request.params.id) {
                request.Object = request.Model.findOne({_id: request.params.id});
            }
            return next();
        }

        this.middleware({
            update:    ['APIAuthMiddleware', 'ModelRequestMiddleware', idBinding],
            create:    ['APIAuthMiddleware', 'ModelRequestMiddleware'],
            trash:     ['APIAuthMiddleware', 'ModelRequestMiddleware', idBinding],
            fetchOne:  ['ModelRequestMiddleware', idBinding],
            fetchAll:  ['ModelRequestMiddleware','ModelPagingMiddleware'],
            search:    ['ModelRequestMiddleware','ModelPagingMiddleware'],
        });
    }


    /**
     * Say Hello.
     * Provide an index of API objects.
     *
     * GET /api/v1/
     */
    index(request,response,next,modelService,url,event)
    {
        var json = {
            message: "Expressway API v1",
            currentUser: request.user,
            index: {}
        };

        modelService.each(function(Model) {
            if ((Model.expose == false && request.user) || Model.expose == true) {
                json.index[Model.name] = url('api/v1/'+Model.slug);
            }
        });

        event.emit('rest.index', json.index);

        return json;
    }


    /**
     * Fetches an object by ID.
     *
     * GET /api/v1/{model}/{id}
     */
    fetchOne(request,response,next)
    {
        return request.Object.exec().then(function(data) {

            var meta = {
                labels: request.Model.labels,
                model: request.Model.name
            };

            return response.api(data, (! data ? 404 : 200), meta);

        }, function(err) {

            return response.apiError(err);
        })
    }


    /**
     * Fetches an array of objects, with pagination.
     *
     * GET /api/v1/{model}
     */
    fetchAll(request,response,next,app)
    {
        var paging = {
            count:      0,
            total:      0,
            limit:      app.config.limit || 10000,
            filter:     request.getQuery('filter', null),
            sort:       request.getQuery('sort', request.Model.range),
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
                var lastValue = data[data.length-1][request.Model.key];
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
                .populate   (request.Model.populate)
                .exec();

            // After finding the count, find the records.
            return promise.then(function(data) {

                paging.setNext(data);

                return response.api(data,200, {
                    pagination: paging,
                    labels: request.Model.labels,
                    model: request.Model.name
                });

            }, function(err) {

                // Model.find() error
                return response.apiError(err);
            });

        }, function(err) {

            // Model.count() error
            return response.apiError(err);
        });
    }


    /**
     * Initiate a new search.
     *
     * POST /api/{model}/search
     */
    search(request,response,next,app)
    {
        var search = request.body;

        var promise = request.Model
            .find(search.where)
            .sort(search.sort)
            .limit(search.limit || app.config.limit)
            .populate(search.populate || request.Model.populate)
            .exec();

        return promise.then(function(data)
        {
            return response.api(data,200, {search:search});

        }, function(err) {

            return response.apiError(err);
        });
    }


    /**
     * Update a model.
     *
     * PUT /api/{model}/{id}
     */
    update(request,response)
    {
        if (request.body._id) delete request.body._id; // Mongoose has problems with this.

        request.body.modified_at = Date.now();

        return request.Model
            .findByIdAndUpdate(request.params.id, request.body, {new:true})
            .populate(request.Model.populate)
            .exec()
            .then(function(data) {

                return response.api(data,200);

            }, function(err){

                return response.apiError(err);
            });
    }


    /**
     * Create a new model.
     *
     * POST /api/{model}
     */
    create(request,response)
    {
        return request.Model.create(request.body).then(function(data)
        {
            return response.api(data,200);

        }, function(err) {

            return response.apiError(err);

        });
    }

    /**
     * Deletes an object by ID.
     *
     * DELETE /api/{model}/{id}
     */
    trash(request,response)
    {
        return request.Model.remove({_id:request.params.id}).then(function(results) {
            var data = {
                results: results,
                objectId : request.params.id
            };
            return response.api(data,200);

        }, function(err) {

            return response.apiError(err);

        });
    }
}

RESTController.routes = {
    "GET    /"              : 'RESTController.index',
    "GET    /:model"        : 'RESTController.fetchAll',
    "POST   /:model"        : 'RESTController.create',
    "POST   /:model/search" : 'RESTController.search',
    "GET    /:model/:id"    : 'RESTController.fetchOne',
    "PUT    /:model/:id"    : 'RESTController.update',
    "DELETE /:model/:id"    : 'RESTController.trash',
};

module.exports = RESTController;