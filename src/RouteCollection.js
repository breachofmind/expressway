"use strict";

var _ = require('lodash');
var Promise = require('bluebird');
var Extension = require('./Extension');

/**
 * Create a searchable index for adding routes before or after other routes.
 * @returns {Router}
 * @private
 */
function createRouteIndex()
{
    this._routes.sort((a,b) => {
        if (a.group == b.group) {
            return a.priority == b.priority ? 0 : a.priority > b.priority ? 1 : -1;
        }
        return a.group > b.group ? 1 : -1;
    });

    this._index = new Map();
    this.each((route,index) => {
        this._index.set(route.name, index);
    });
    return this;
}

/**
 * A collection of staged routes, which boot into express when the application boots.
 * @author Mike Adamczyk <mike@bom.us>
 */
class RouteCollection
{
    /**
     * Constructor.
     * @param extension {Extension}
     */
    constructor(extension)
    {
        /**
         * The parent extension.
         * @type {Extension}
         * @private
         */
        this._extension = extension;

        /**
         * The route index.
         * @type {Array}
         * @private
         */
        this._routes = [];

        /**
         * Static content path mappings.
         * @type {{}}
         * @private
         */
        this._statics = {};

        /**
         * Error handling middleware.
         * @type {{404: string, 500: string}}
         * @private
         */
        this._errors = {
            "404" : "NotFound",
            "500" : "NotFound"
        };

        /**
         * An index for looking up route objects.
         * Mostly used for adding routes before or after other routes.
         * @type {Map}
         * @private
         */
        this._index = new Map();
    }

    /**
     * Get the protected routes array.
     * @returns {Array}
     */
    get routes()
    {
        return this._routes;
    }

    /**
     * Get the protected Application instance.
     * @returns {Application}
     */
    get extension()
    {
        return this._extension;
    }

    /**
     * Get the protected Application instance.
     * @returns {Application}
     */
    get app()
    {
        return this.extension.app;
    }

    /**
     * Return the total amount of routes or total for a group.
     * @param group {Number}
     * @returns {Number}
     */
    length(group)
    {
        if (! arguments.length) {
            return this.routes.length;
        }
        return this.each(route => {
            return route.group == group;
        }).length;
    }

    /**
     * Iterate through each route.
     * @param fn {Function}
     * @returns {Array}
     */
    each(fn)
    {
        return _.compact(this._routes.map((route,index) => {
            return fn(route,index);
        }));
    }

    /**
     * Add a global middleware route.
     * @param routes
     * @param group
     * @returns {Router}
     */
    middleware(routes,group=0)
    {
        return this.add(routes,group);
    }

    /**
     * Add some routes.
     * Use a function that returns a promise or string.
     * @param routes String|Array|Function
     * @param group
     * @param priority
     * @returns {Router}
     */
    add(routes,group=10,priority=null)
    {
        [].concat(routes).forEach(route => {
            let index = priority == null ? this.length(group) : priority;
            this._routes.push({name:route, group:group, priority:index});
        });
        createRouteIndex.call(this);
        return this;
    }

    /**
     * Use a configuration object.
     * @param config Object
     * @returns {RouteCollection}
     */
    use(config)
    {
        if (! config) return this;

        if (config.middleware) this.middleware(config.middleware);
        if (config.paths) this.add(config.paths);
        if (config.error) this.error(404, config.error);

        return this;
    }

    /**
     * Add a route before a route.
     * @param name string
     * @param route *
     * @returns {RouteCollection}
     */
    before(name,route)
    {
        let index = this._index.get(name);
        if (index > -1) {
            let what = this._routes[index];
            this.add(route, what.group, what.priority - 0.1);
        }
        return this;
    }

    /**
     * Add a route after a route.
     * @param name string
     * @param route *
     * @returns {RouteCollection}
     */
    after(name,route)
    {
        let index = this._index.get(name);
        if (index > -1) {
            let what = this._routes[index];
            this.add(route, what.group, what.priority + 0.1);
        }
        return this;
    }

    /**
     * Create a static content path mapping.
     * @param uri string
     * @param path string
     * @returns {RouteCollection}
     */
    static(uri, path)
    {
        this._statics[uri] = path;
        return this;
    }

    /**
     * Return the static path array.
     * @returns {Array}
     */
    get statics()
    {
        return _.map(this._statics, (path,uri) => {
            return {uri: uri, path: path};
        });
    }

    /**
     * Add an error handling route.
     * @param type string|number
     * @param route *
     * @returns {RouteCollection}
     */
    error(type,route)
    {
        this._errors[type.toString()] = route;
        return this;
    }

    /**
     * Add the declared routes to express.
     * @returns {Promise}
     */
    boot()
    {
        let express = this.extension.express;

        let promises = this.each(route =>
        {
            if (typeof route.name == 'function') {
                return route.name.call(this.extension);
            }
            return Promise.resolve(route.name);
        });

        // Remove routes if set already.
        if (express._router) {
            console.log(express._router.map);
        }

        return Promise.all(promises).then(routes =>
        {
            if (this.extension.base !== "/") {
                this.app.root.mount(this.extension);
            }
            let middleware = this.app.dispatcher.resolve(routes,this.extension);

            express.use("/",middleware);

            express.use(this.app.dispatcher.resolve(this._errors["404"], this.extension));

            return middleware;
        });
    }
}

module.exports = RouteCollection;