"use strict";

var express = require('express');
var utils   = require('./support/utils');
var _       = require('lodash');

class Extension
{
    /**
     * Constructor.
     * @param app Application
     */
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

        /**
         * If using Static middleware, defined static paths.
         * @type {{}}
         */
        this.staticPaths = {};

        /**
         * Array of global middleware.
         * @type {Array}
         */
        this.middleware = [];

        /**
         * Array of route middleware.
         * @type {Array}
         */
        this.routes = [];

        /**
         * Default settings.
         * @type {{}}
         */
        this.defaults = {};

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
        if (! (extension instanceof Extension)) {
            throw new TypeError('must be instance of Extension');
        }
        if (! base) base = extension.base;
        this.express.use(base, extension.express);
        this.mounted[base] = extension;

        // Migrate some settings
        if (! extension.express.get('view engine')) {
            extension.express.set('views', this.express.get('views'));
            extension.express.set('view engine', this.express.get('view engine'));
        }

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
     * @param done Function
     */
    boot(done)
    {
        this.add(this.middleware);
        this.add(this.routes);

        if (this.base !== "/") {
            this.app.root.mount(this)
        }

        done();
    }

    /**
     * Render using the express instance.
     * @param file string
     * @param data object
     * @returns {Promise}
     */
    render(file,data={})
    {
        return new Promise((resolve,reject) =>
        {
            this.express.render(file,data,function(err,str) {
                if (err) return reject(err);
                return resolve(str);
            });
        });
    }

    /**
     * Require a module with the app and extension as dependencies.
     * @param fn Function|String
     * @param args Array
     * @returns {Extension}
     */
    use(fn,args=[])
    {
        if (Array.isArray(fn)) {
            fn.forEach(item => { this.use(item,args) });

            return this;
        }
        args = [this.app,this].concat([args]);
        let module = typeof fn == 'string' ? require(fn) : fn;
        this.app.call(module,null,args);

        return this;
    }
}

module.exports = Extension;