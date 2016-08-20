"use strict";
module.exports = function(Controller, app)
{
    var defaults = app.get('controllerDefaults');

    return Controller.create('restController', defaults.REST.controller);
};
