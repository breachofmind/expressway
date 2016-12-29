"use strict";

var express = require('express');
var utils   = require('./support/utils');
var _       = require('lodash');

class Extension
{
    constructor(app)
    {
        /**
         * Application instance.
         * @type Application
         */
        this.app = app;

        /**
         * The base uri for this extension.
         * @type {string}
         */
        this.base = "/";

        /**
         * Extensions mounted to this extension.
         * @type {Object}
         */
        this.mounted = {};

        this.middleware = [];
        this.routes = [];

        /**
         * The express instance.
         * @type express
         */
        this.express = express();

        this.express.$extension = this;

        this.express.set('env', app.env === ENV_PROD ? 'production' : 'development');
    }

    /**
     * Get the name of this extension.
     * @returns {String}
     */
    get name()
    {
        return this.constructor.name;
    }

    /**
     * Mount an extension to this extension.
     * @param extension Extension
     * @param base string
     * @returns {Extension}
     */
    mount(extension,base=null)
    {
        if (! base) base = extension.base;
        if (! (extension instanceof Extension)) {
            throw new TypeError('must be instance of Extension');
        }
        this.express.use(base, extension.express);
        this.mounted[base] = extension;

        return this;
    }

    /**
     * Adds routes to the express application.
     * @param base {String|Array}
     * @param routes {String|Array} optional
     * @returns {Extension}
     */
    add(base,routes)
    {
        if (arguments.length == 1) {
            return this.add('/', base);
        }
        let middleware = this.app.dispatcher.resolve(routes,this);

        this.express.use(base,middleware);

        return this;
    }

    /**
     * Default boot method.
     * @param app
     */
    boot(app)
    {
        this.add(this.middleware);
        this.add(this.routes);
    }
}

module.exports = Extension;