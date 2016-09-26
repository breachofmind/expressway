"use strict";

var isArray = Array.isArray;

class Collection extends Array
{
    constructor(items)
    {
        if (isArray(items)) {
            items.forEach(function(item) {
                this.push(item)
            }.bind(this));
        } else {
            super(items);
        }
    }
}