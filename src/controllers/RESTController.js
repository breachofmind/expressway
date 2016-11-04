"use strict";

var _           = require('lodash');
var Expressway  = require('expressway');
var utils       = Expressway.utils;

class RESTController extends Expressway.Controller
{
    constructor(app, modelService)
    {
        super(app);

        this.middleware({
            update:    ['APIAuth', 'ModelRequest', 'ModelById'],
            create:    ['APIAuth', 'ModelRequest'],
            trash:     ['APIAuth', 'ModelRequest', 'ModelById'],
            fetchOne:  ['ModelRequest', 'ModelById'],
            fetchAll:  ['ModelRequest','Paging'],
            search:    ['ModelRequest','Paging', 'ModelSearch'],
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

        modelService.each(model => {
            if ((model.expose == false && request.user) || model.expose == true) {
                json.index[model.name] = url('api/v1/'+model.slug);
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
        return response.api(request.params.object, 200, {
            model: request.params.model.name
        })
    }


    /**
     * Fetches an array of objects, with pagination.
     *
     * GET /api/v1/{model}
     */
    fetchAll(request,response,next,app)
    {
        let model = request.params.model;
        let paging = request.params.paging;

        // Find the total record count first, then find the range.
        return model.count(paging.filter).exec().then(function(count) {

            paging.total = count;

            var promise = model
                .find       (paging.filter)
                .sort       (paging.sort)
                .limit      (paging.limit)
                .populate   (model.populate)
                .exec();

            // After finding the count, find the records.
            return promise.then(function(data) {

                paging.setNext(data);

                return response.api(data,200, {
                    pagination: paging,
                    model: model.name
                });

            }, function(err) {

                // model.find() error
                return response.apiError(err);
            });

        }, function(err) {

            // model.count() error
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
        return request.params.query.exec().then(function(data)
        {
            return response.api(data,200, {search:request.body});

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
        let object = request.params.object;
        let model = request.params.model;

        if (request.body._id) delete request.body._id; // Mongoose has problems with this.

        request.body.modified_at = Date.now();

        return object
            .update(request.params.id, request.body, {new:true})
            .populate(model.populate)
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
        return request.params.model.create(request.body).then(function(data)
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
        let object = request.params.object;
        let model = request.params.model;

        return model.remove({_id: object.id}).then(function(results) {
            var data = {
                results: results,
                objectId : object.id
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