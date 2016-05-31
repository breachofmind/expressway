"use strict";

var Model     = require('../model');

var app;

/**
 * Super handy paginator class.
 * Helps with the REST response for fetching models with query params.
 */
class Paginator
{
    /**
     * Construct the object with a new request.
     * @param blueprint ModelFactory
     * @param request
     * @param response
     */
    constructor(blueprint,request,response)
    {
        if (!app) app = require('../application').instance;

        this.response   = response;
        this.request    = request;
        this.params     = request.params;
        this.query      = request.query;
        this.blueprint  = blueprint;
        this.Model      = blueprint.model;
        this.limit      = app.config.limit || 20;
        this.total      = 0;

        this.paginate = this.query.p
            ? new Buffer(this.query.p,'base64').toString('utf-8')
            : false;

        this.filter = parseFilter( this.query.filter );
        this.sort = parseSort( this.query.sort );
    }

    /**
     * Execute the request and return a response.
     * @returns {Promise.<T>}
     */
    execute()
    {
        let self = this;

        return this.Model.count(this.queryFind()).exec().then(function(count) {

            self.total = count;

            return self.responseHandler (
                self.Model
                    .find ( self.queryFind() )
                    .sort ( self.querySort() )
                    .limit( self.limit )
                    .populate( self.blueprint.population )
                    .exec ()
            );

        }, function(err) {

            return self.response.api(err,400);
        })
    }

    /**
     * Handles the response after the count is received.
     * @param promise
     * @returns {Promise}
     */
    responseHandler(promise)
    {
        let self = this;

        return promise.then(function(data) {

            self.setPaginationData(data);

            return self.response.api(data,200);

        }, function(err) {

            return self.response.api(err,400);
        })
    }

    /**
     * Sets up the pagination data inside the request after the data comes back.
     * @param data object|array
     * @returns void
     */
    setPaginationData(data)
    {
        if (data.length) {
            var lastValue = data[data.length-1][this.blueprint.key];
        }

        // The Response object takes care of this.
        this.request.pagination = {
            count:      data.length,
            limit:      this.limit,
            total:      this.total,
            filter:     this.filter,
            sort:       this.querySort(),
            url:        this.total > this.limit
                ? new Buffer(lastValue.toString()).toString('base64')
                : null
        }
    }

    /**
     * Builds the find query.
     * @returns {{}}
     */
    queryFind()
    {
        var q = {};
        for(let prop in this.filter) {
            q[prop] = this.filter[prop];
        }

        if (! this.paginate) {
            return q;
        }
        q[this.blueprint.key] = this.blueprint.sort == 1
            ? {$gt:this.paginate}
            : {$lt:this.paginate};

        return q;
    }

    /**
     * Builds the sort query.
     * @returns {{}}
     */
    querySort()
    {
        var q = {};
        if (this.sort) {
            return this.sort;
        }
        q[this.blueprint.key] = this.blueprint.sort;
        return q;
    }

    /**
     * Named constructor.
     * @param request
     * @returns {Paginator}
     */
    static make(blueprint,request,response)
    {
        return new Paginator(blueprint,request,response);
    }
}

/**
 * Parser for the filter query.
 * @example ?filter=posts.mentions:mommy|posts.type:conversation
 * @param string
 * @returns {*}
 */
function parseFilter(string)
{
    if (! string || string == "") return null;
    var filter = {};

    var ands = string.split("|");

    ands.forEach(function(pairs) {
        var keyval = pairs.split(":");
        var key = keyval.shift();
        filter[key] = keyval.join(":");
    });

    return filter;
}

function parseSort(string)
{
    if (! string || string == "") return {};
    var sort = {};
    var parts = string.split(":");
    sort[parts[0]] = parts.length>1 ? parseInt(parts[1]) : 1;
    return sort;
}

module.exports = Paginator;