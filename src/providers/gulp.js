"use strict";

var mvc = require('../../index');

/**
 *
 * @param app Application
 * @constructor
 */
function Gulper(app)
{
    this.paths = {
        build:  app.path('static_path', 'public'),
        scss:   app.path('resources_path', 'resources') + "scss",
        js:     app.path('resources_path', 'resources') + "js",
        views:  app.path('views_path', 'resources/views')
    };

    /**
     * Return a complete path to the path name.
     * @param name string
     * @param path string|undefined
     * @returns {string}
     */
    this.pathTo =function(name, path)
    {
        return this.paths[name] + "/" + (path || "");
    };

    /**
     * Provide an array to a path name, and prepend the path to each file.
     * @param name string
     * @param pathArray array
     * @returns {*|Object|Array}
     */
    this.pathsTo = function(name, pathArray)
    {
        return pathArray.map(function(path) {
            return this.pathTo(name,path);
        }.bind(this))
    };
}

/**
 * Gulp helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GulpProvider extends mvc.Provider
{
    constructor()
    {
        this.inside([ENV_CLI]);
    }

    register(app)
    {
        mvc.Gulper = new Gulper(app);
    }
}