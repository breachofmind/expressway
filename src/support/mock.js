"use strict";

var expressway = require('../../expressway');
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

/**
 * Return a new Application instance.
 */
Object.defineProperty(exports, 'app', {
    get() {
        return expressway({
            context: CXT_TEST,
            rootPath: path.resolve(__dirname,'../../demo')
        });
    }
});