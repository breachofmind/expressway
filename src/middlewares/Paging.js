"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var utils = Expressway.utils;
var config = app.get('config');

class Paging extends Expressway.Middleware
{
    method(request,response,next)
    {
        let model = request.params.model;

        if (request.query.p) {
            request.query.filter = model.paging( utils.fromBase64(request.query.p) );
        }

        var paging = {
            count:      0,
            total:      0,
            limit:      config('limit',10000),
            filter:     request.getQuery('filter', null),
            sort:       request.getQuery('sort', model.range),
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
                var lastValue = data[data.length-1][model.key];
            }
            this.count = data.length;
            this.next = this.total > this.limit
                ? utils.toBase64(lastValue.toString())
                : null;

            return this;
        };

        request.params.paging = paging;

        return next();
    }
}

module.exports = Paging;

