"use strict";
module.exports = function(Controller, app)
{
    var defaults = app.get('controllerDefaultsProvider');

    return Controller.create('langController', defaults.Locales.controller);
};
