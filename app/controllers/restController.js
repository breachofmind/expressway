"use strict";
module.exports = function(Factory)
{
    return Factory.create('restController', Factory.basic.REST);
};
