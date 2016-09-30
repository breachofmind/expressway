"use strict";

var isArray = Array.isArray;
var _ = require('lodash');

class Collection extends Array
{
    constructor(items, model)
    {
        super();
        this.push.apply(this,items);
        this.model = model;
    }

    /**
     * Divide the array into given chunk amount.
     * @param size Number
     * @returns {Array}
     */
    chunk(size) {
        var arr = _.chunk(this,size);
        return arr.map(function(chunk) {
            return this.model.collection(chunk);
        }.bind(this));
    }

    /**
     * Concat two collections of the same model type together.
     * @param collection Collection
     * @returns {*}
     */
    concat(collection) {
        if (collection.model !== this.model) {
            throw new Error ("Can't concat to collections with differing models");
        }
        var arr = super.concat(collection);
        return this.model.collection(arr);
    }

    /**
     * Removes falsey values.
     * @returns {*}
     */
    compact() {
        return this.model.collection(_.compact(this));
    }

    /**
     * Get the first object.
     * @returns {object}
     */
    first()
    {
        return _.head(this);
    }

    /**
     * Get the last object.
     * @returns {object}
     */
    last()
    {
        return _.last(this);
    }

    /**
     * Return a new collection of models matching the expression.
     * @param by function
     * @returns {Collection}
     */
    filter(by)
    {
        return this.model.collection(_.filter(this, by));
    }

    /**
     * Find the first object matching the expression.
     * @param by function
     * @returns {object}
     */
    find(by)
    {
        return _.find(this, by);
    }

    /**
     * Find an object by ID.
     * @param id Number|string
     * @param idProperty string, optional
     * @returns {*}
     */
    byId(id, idProperty)
    {
        if (! idProperty) idProperty = "id";
        return this.find(function(model) {
            return model[idProperty] == id;
        });
    }
}

module.exports = Collection;