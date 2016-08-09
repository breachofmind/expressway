"use strict";
var utils = require('./support/utils');

module.exports = function RouterProvider(app)
{
    var routes = [];

    /**
     * Route class.
     * Creating a new route will attach it to the express router.
     *
     * @param verb string get|post|put|delete...
     * @param url string
     * @param methods array|string
     * @constructor
     */
    function Route(verb,url,methods)
    {
        this.verb = verb;
        this.url = url;
        this.methods = utils.getRouteFunctions(methods);
        this.order = routes.length;
        this.controller = typeof methods == 'string' ? methods : null;

        if (! this.methods.length) {
            throw new Error("Route declaration missing handler: "+url);
        }

        routes.push(this);
        app.express[verb].apply(app.express, [url].concat(this.methods));
    }

    /**
     * The router class to export.
     * @constructor
     */
    function Router()
    {
        this.get = route.call(this,'get');
        this.post = route.call(this,'post');
        this.put = route.call(this,'put');
        this.patch = route.call(this,'patch');
        this.delete = route.call(this,'delete');
        this.options = route.call(this,'options');

        /**
         * Return a list of the routes created.
         * @returns {object|array}
         */
        this.list = function(index)
        {
            return arguments.length ? routes[index] : routes;
        };

        /**
         * Create a new route.
         * @param verb string get|post|put|patch|delete|options
         * @returns {Function}
         */
        function route(verb)
        {
            return function(object)
            {
                for(let routeUrl in object) {
                    new Route(verb, routeUrl, object[routeUrl]);
                }
                return this;
            }.bind(this);
        }
    }

    return new Router();
};