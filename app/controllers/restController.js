"use strict";
module.exports = function(Controller, app)
{
    var defaults = app.get('controllerDefaultsProvider');

    return Controller.create('restController', defaults.REST.controller);
};
