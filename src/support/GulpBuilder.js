"use strict";

var concat     = require('gulp-concat');
var sass       = require('gulp-sass');
var concat     = require('gulp-concat');
var autoprefix = require('gulp-autoprefixer');

class GulpBuilder
{
    constructor(app,gulp)
    {
        this.app = app;
        this.gulp = gulp;

        this.paths = {
            build:  app.path('static_path', 'public'),
            scss:   app.path('resources_path', 'resources') + "scss",
            js:     app.path('resources_path', 'resources') + "js",
            jsx:    app.path('resources_path', 'resources') + "jsx",
            lib:    app.path('resources_path', 'resources') + "js/vendor",
            views:  app.path('views_path', 'resources/views'),
            npm:    app.rootPath('../node_modules'),
        };
    }

    /**
     * Return a complete path to the path name.
     * @param name string
     * @param path string|undefined
     * @returns {string}
     */
    pathTo(name, path)
    {
        return this.paths[name] + "/" + (path || "");
    };

    /**
     * Provide an array to a path name, and prepend the path to each file.
     * @param name string
     * @param pathArray array
     * @returns {*|Object|Array}
     */
    collection(name, pathArray)
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
    collections(object)
    {
        Object.keys(object).forEach(function(path) {
            object[path] = this.collection(path, object[path]);
        }.bind(this));
        return object;
    };

    /**
     * Perform a simple concatenation of the given files.
     * @param files array
     * @param toFile string
     * @returns {function}
     */
    concat(files, toFile)
    {
        return function() {
            if (files.length)
                this.gulp.src( files ).pipe( concat(toFile) ).pipe( this.dest() );
        }.bind(this);
    }

    /**
     * Default sass options.
     * @param files
     * @param options
     * @returns {function(this:GulpBuilder)}
     */
    sass(files, options)
    {
        return function() {
            this.gulp.src(files)
                .pipe(sass(options).on('error', sass.logError))
                .pipe(autoprefix())
                .pipe(this.dest());
        }.bind(this);

    }

    /**
     * Set up a watcher on the given path.
     * The path normally corresponds to the file type, ie js|scss|html
     * @param path
     * @param tasks
     */
    watch(path, tasks)
    {
        this.gulp.watch(this.paths[path] + '/**/*.'+path, tasks);
    }

    /**
     * Create a gulp dest to the build path.
     * @param path string
     * @returns {gulp}
     */
    dest(path)
    {
        return this.gulp.dest(this.paths.build+(path ? "/"+path : ""));
    }
}

module.exports = GulpBuilder;