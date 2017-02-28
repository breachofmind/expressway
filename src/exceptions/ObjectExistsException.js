"use strict";

class ObjectExistsException extends Error
{
    constructor(message,collection,name)
    {
        super(message,1);

        this.message += "\nname: "+name;
        this.message += "\ncollection: "+collection.name;

        this.collection = collection;
        this.object = collection.get(name);
    }
}

global.ObjectExistsException = ObjectExistsException;