"use strict";

var Expressway  = require('expressway');
var path        = require('path');
var cp          = require('child_process');

Expressway.start(path.join(__dirname, "demo/app"), function(url,app) {

    // Boot google chrome if developing locally.
    if (app.env == ENV_LOCAL) {
        cp.exec(`open /Applications/Google\\ Chrome.app ${url()}`, function(err){});
    }
});