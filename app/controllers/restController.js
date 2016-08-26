var ExpressMVC = require('../../index');
var Controller = ExpressMVC.Controller;
var defaults = ExpressMVC.Provider.get('controllerDefaults');

module.exports = Controller.create('restController', defaults.REST.controller);