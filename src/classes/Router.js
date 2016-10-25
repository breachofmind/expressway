"use strict";

var Expressway = require('expressway');
var Express    = require('express');
var utils      = Expressway.utils;
var app        = Expressway.instance.app;

var [controllerService, debug] = app.get('controllerService','debug');


class Router
{
    constructor()
    {
        this.applications = {};
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
        this.applications[name] = $express;

        this[name] = function(base,routes)
        {
            if (! routes) {
                routes = base;
                base = "/";
            }

            var router = Express.Router(options);

            utils.toRouteMap(routes).forEach((middleware,opts) => {

                var stack = controllerService.getRouteFunctions(middleware);

                if (! stack.length) throw new Error("Route declaration missing routes: "+opts.url);

                // Add the routes to the express router.
                router[opts.verb].apply(router, [opts.url].concat(stack) );
            });

            router.$basepath = base == "/" ? "" : base;

            // Add the router to the express application.
            $express.use(base,router);
        };

        return this;
    }
}

module.exports = Router;