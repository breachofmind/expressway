"use strict";

var colors = require('colors/safe');

class ObjectExistsException extends Error
{
    constructor(message,collection,name)
    {
        super(message,1);

        this.message += "\nname: "+colors.red(name);
        this.message += "\ncollection: "+colors.red(collection.name);

        this.collection = collection;
        this.object = collection.get(name);
    }
}

global.ObjectExistsException = ObjectExistsException;