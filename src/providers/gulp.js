"use strict";

var expressway = require('expressway');

/**
 *
 * @param app Application
 * @constructor
 */
function Gulper(app)
{
    var gulp;

    this.paths = {
        build:  app.path('static_path', 'public'),
        scss:   app.path('resources_path', 'resources') + "scss",
        js:     app.path('resources_path', 'resources') + "js",
        lib:    app.path('resource_path', 'resources') + "js/vendor",
        views:  app.path('views_path', 'resources/views'),
        npm:    app.rootPath('../node_modules'),
    };

    /**
     * Set the gulp object.
     * @param object
     * @returns {Gulper}
     */
    this.set = function(object)
    {
        gulp = object;
        return this;
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
    this.collection = function(name, pathArray)
    {
        return pathArray.map(function(path) {
            return this.pathTo(name,path);
        }.bind(this))
    };

    /**
     * Create collections out the given path>array object.
     * @param object
     * @returns {{}}
     */
    this.collections = function(object)
    {
        Object.keys(object).forEach(function(path) {
            object[path] = this.collection(path, object[path]);
        }.bind(this));
        return object;
    };

    /**
     * Create a gulp dest to the build path.
     * @param path string
     * @returns {gulp}
     */
    this.dest = function(path)
    {
        return gulp.dest(this.paths.build+(path ? "/"+path : ""));
    }
}

/**
 * Gulp helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GulpProvider extends expressway.Provider
{
    constructor()
    {
        super('gulp');

        this.inside([ENV_CLI]);
    }

    register(app)
    {
        expressway.Gulper = new Gulper(app);
    }
}

module.exports = new GulpProvider();