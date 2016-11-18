"use strict";

var Expressway = require('expressway');
var Express    = require('express');
var utils      = Expressway.utils;
var app        = Expressway.instance.app;

var [controllerService, debug] = app.get('controllerService','debug');


class RouterFactory
{
    constructor()
    {
        this.routers = {};
        this.aliases = {};
    }

    alias(name,route)
    {
        this.aliases[name] = route;
    }

    to(alias,uri="")
    {
        return this.aliases[alias] + uri;
    }

    use(routes)
    {
        if (typeof routes != 'function') {
            throw new TypeError('Argument must be a function');
        }
        return app.call(routes,[this]);
    }

    /**
     * Mount a new router.
     * Attaches function with the given name which provides
     * an easy way of declaring routes for parts of the application.
     * @param name string
     * @param $express Express
     * @param options Object for express.Router
     * @returns {Router}
     */
    mount(name, $express, options={})
    {
        var router = new Router(name,$express,options);

        this.routers[name] = router;

        this[name] = router;

        return this;
    }

    /**
     * Return a human readable list of route stacks for each application.
     * @returns {Array}
     */
    stacks(appName)
    {
        if (appName) {
            return Expressway.utils.getMiddlewareStack(this.routers[appName].express);
        }

        return Object.keys(this.routers).map((key,i) => {
            let router = this.routers[key];
            return {
                index: i,
                name: key,
                stack: Expressway.utils.getMiddlewareStack(router.express)
            }
        });
    }
}

class Router
{
    constructor(name,express,options)
    {
        this.name = name;
        this.express = express;
        this.options = options;
    }

    /**
     * Add some routes or middleware.
     * @param base string|object
     * @param routes string|object
     * @returns {Router}
     */
    add(base,routes)
    {
        if (arguments.length == 1) {
            routes = base;
            base = "/";

            // This is global middleware.
            if (Array.isArray(routes) || typeof routes == 'string') {
                this.express.use(base, controllerService.getRouteFunctions(routes));
                return;
            }
        }
        // routes is an object of {"VERB URI" : [middleware]}
        var router = Express.Router(this.options);

        utils.toRouteMap(routes).forEach((middleware,opts) => {

            var stack = controllerService.getRouteFunctions(middleware);

            if (! stack.length) throw new Error("Route declaration missing routes: "+opts.url);

            // Add the routes to the express router.
            router[opts.verb].apply(router, [opts.url].concat(stack) );
        });

        // Add the router to the express application.
        this.express.use(base,router);

        return this;
    }

    static(uri,dir)
    {
        if (arguments.length == 1) {
            dir = uri;
            uri = "/";
        }
        var route = Express.static(dir.toString());
        route.$dir = dir.toString();
        this.express.use(uri,route);
    }
}

module.exports = RouterFactory;