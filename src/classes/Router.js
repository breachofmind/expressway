"use strict";

var Expressway          = require('expressway');
var utils               = Expressway.utils;
var app                 = Expressway.instance.app;

var [controllerService, express, debug] = app.get('controllerService','express','debug');

const VERBS = ['get','post','put','patch','delete','options'];

/**
 * A singular Route object.
 * Used with the Router class.
 */
class Route
{
    /**
     * Constructor
     * @param verb string
     * @param url string
     * @param stack {Array}
     */
    constructor(verb,url,stack)
    {
        this.index = null;
        this.verb = verb.toLowerCase();
        this.url = url;
        this.stack = stack;

        if(! stack.length) {
            throw new Error("Route declaration missing routes: "+url);
        }
    }

    /**
     * Add the route to the router and to Express.
     * @param router Router
     */
    addTo(router)
    {
        this.index = router.routes.length;

        express[this.verb].apply(express, [this.url].concat(this.stack));

        debug(this,'#%s: %s - %s (%s Middleware)',
            this.index,
            this.verb.toUpperCase(),
            this.url,
            this.stack.length
        );
        router.routes.push(this);
    }
}

/**
 * Router class.
 * A customized way to define routes for the application.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Router
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        var router = this;

        this.app = app;

        this.routes = [];

        // Verb method setup.
        // Exposed to developer in routes.js config.
        VERBS.map(function(verb) {
            router[verb] = (function(verb){

                // object is a hash: { url: [string, function] }
                return function(object) {
                    Object.keys(object).forEach(function(url) {
                        new Route(verb,url,controllerService.getRouteFunctions(object[url])).addTo(router);
                    });
                    return router;
                }
            })(verb);
        });
    }

    /**
     * Return a list of routes as a string by index.
     * @returns {Array}
     */
    list()
    {
        return this.routes.map(function(route) {
            return `#${route.index}\t${route.verb.toUpperCase()}\t${route.url}`;
        });
    };
}

module.exports = Router;