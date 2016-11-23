"use strict";

var utils = require('./src/support/utils');

module.exports = utils.getModulesAsHash(__dirname+'/src/providers/',true);