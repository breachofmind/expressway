"use strict";

var Expressway  = require('expressway');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var watchify    = require('watchify');
var browserify  = require('browserify');
var gutil       = require('gulp-util');
var concat      = require('gulp-concat');
var sass        = require('gulp-sass');
var livereload  = require('gulp-livereload');
var sourcemaps  = require('gulp-sourcemaps');
var autoprefix  = require('gulp-autoprefixer');
var _           = require('lodash');
var app         = Expressway.instance.app;
var path        = app.get('path');
var config      = app.get('config');
var utils       = Expressway.utils;

/**
 * A helper class for creating gulp tasks.
 * Includes some commonly used settings.
 */
class GulpHelper
{
    constructor(gulp)
    {
        this.gulp = gulp;
    }

    /**
     * Set up watchify/browserify bundler.
     * @param options Object
     */
    js(options)
    {
        let opts = _.assign({}, watchify.args, options);
        opts.entries = utils.toStringEach(opts.entries);
        let b = watchify(browserify(opts));

        var bundle = () => {
            var stream = b.bundle()
                .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                .pipe(source(opts.outputFile || 'bundle.js'))
                .pipe(buffer());

            if (opts.sourcemaps) {
                stream.pipe(sourcemaps.init({loadMaps:true}))
                    .pipe(sourcemaps.write('./'));
            }

            stream.pipe(this.dest())
        };

        b.on('update', bundle);
        b.on('log', gutil.log);

        this.gulp.task('js', bundle);
    }

    /**
     * Set up a sass compiler.
     * @param files array
     * @param opts Object
     */
    sass(files,opts)
    {
        this.gulp.task('sass', () => {
            this.gulp.src(utils.toStringEach(files))
                .pipe(sass(opts).on('error', sass.logError))
                .pipe(autoprefix())
                .pipe(this.dest());
        });
    }

    /**
     * Create a watch task.
     * @param paths array
     */
    watch(paths)
    {
        var livereloadPaths = [];

        this.gulp.task('watch', () => {

            livereload.listen();

            paths.forEach(item => {
                // This is for livereload only.
                if (typeof item == 'string' || item.isPath) {
                    livereloadPaths.push(item.toString());

                } else if (Array.isArray(item)) {
                    let [pathToWatch, taskArray] = item;
                    this.gulp.watch(pathToWatch.toString(), taskArray);
                }
            });



            this.gulp.watch(livereloadPaths, event => {
                this.gulp.src(event.path).pipe( livereload() );
            });
        });

    }

    /**
     * Create a generic gulp task.
     * @param name string
     * @param tasks array
     * @returns {*}
     */
    task(name, tasks)
    {
        return this.gulp.task(name,tasks);
    }

    /**
     * Create a gulp dest to the build path.
     * @param uri string
     * @returns {gulp}
     */
    dest(uri="")
    {
        return this.gulp.dest(path.public(uri).get());
    }
}

module.exports = GulpHelper;