"use strict";

var Expressway = require('expressway');

class Policy
{
    get name() {
        return this.constructor.name;
    }
}

module.exports = Policy;