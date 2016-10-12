"use strict";

var Expressway          = require('expressway');
var utils               = Expressway.utils;
var app                 = Expressway.instance.app;
var ControllerProvider  = app.get('ControllerProvider');
var express             = app.get('express');
var debug               = app.get('debug');

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
     * @param methods func|array|string
     */
    constructor(verb,url,methods)
    {
        this.index = null;
        this.verb = verb.toLowerCase();
        this.url = url;
        this.methods = methods;

        if(! methods.length) {
            throw new Error("Route declaration missing handler: "+url);
        }
    }

    /**
     * Add the route to the router and to Express.
     * @param router Router
     */
    addTo(router)
    {
        this.index = router.routes.length;

        express[this.verb].apply(express, [this.url].concat(this.methods));

        debug(this,'#%s: %s - %s (%s Middleware)',
            this.index,
            this.verb.toUpperCase(),
            this.url,
            this.methods.length
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
                        var stack = utils.getRouteFunctions(object[url], ControllerProvider);
                        new Route(verb,url,stack).addTo(router);
                    });
                    return router;
                }
            })(verb);
        });
    }

    /**
     * The default not found 404 handler.
     * Overwrite with a custom function if needed.
     * @param request
     * @param response
     * @param next
     */
    notFound(request,response,next)
    {
        return response.smart(response.view('error/404'),404);
    };

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