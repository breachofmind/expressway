"use strict";

var expressway = require('expressway');
var path = require('path');

exports.request = {};

exports.response = {
    headerSent:false,
    smart(value) {
        return value;
    }
};

exports.next = function(err) {
    if (err) throw new Error(err);
};

exports.middleware = [exports.request,exports.response,exports.next];

exports.config = {
    appKey: "TEST",
    env: ENV_LOCAL,
    url: "http://localhost",
    port: 8081,
    paths: {
        tmp: "./tmp",
        views: "./resources/views",
    }
};

/**
 * Return a new Application instance.
 */
Object.defineProperty(exports, 'app', {
    get() {
        return expressway({
            config: exports.config,
            context: CXT_TEST,
            rootPath: path.resolve(__dirname,'../../demo')
        });
    }
});