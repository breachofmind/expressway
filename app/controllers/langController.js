var ExpressMVC = require('../../index');
var Controller = ExpressMVC.Controller;
var defaults = ExpressMVC.Provider.get('controllerDefaults');

module.exports = Controller.create('langController', defaults.Locales.controller);