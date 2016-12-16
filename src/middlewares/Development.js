"use strict";

var Expressway  = require('expressway');
var utils       = Expressway.utils;
var webpack     = require('webpack');
var livereload  = require('livereload');
var app         = Expressway.app;

var [$app,log,debug,url] = app.get('$app','log','debug','url');

class Development extends Expressway.Middleware
{
    get type() {
        return "Core"
    }
    get description() {
        return "Adds webpack hot module replacement to a module (ENV_LOCAL only)";
    }

    /**
     * Constuctor,
     */
    constructor()
    {
        super();

        /**
         * Is livereload currently running?
         * @type {boolean}
         */
        this.livereloadRunning = false;

        /**
         * Livereload configuration options.
         * @type {{dirs: Array, options: {exts: [*]}}}
         */
        this.livereload = {
            dirs: [],
            options: {
                originalPath: url(),
                exts: ['htm','html','ejs','hbs','png','gif','jpg','css'],
            }
        };

        app.register('devMiddleware', this, "Development Middleware instance");
    }

    /**
     * Have the livereload server watch a path.
     * @param path
     * @returns {Development}
     */
    watch(path)
    {
        if (typeof path != 'string') {
            throw new TypeError('path must be a string');
        }
        this.livereload.dirs.push(path);

        return this;
    }

    /**
     * Dispatch middleware functions to express.
     * @param $module
     * @returns {(*|*)[]}
     */
    dispatch($module)
    {
        if (app.env !== ENV_LOCAL) return;

        this.startLivereload($module);

        return this.startWebpackDev($module);
    }

    /**
     * Start the webpack hot middleware dev server.
     * @param $module Module
     * @returns {[*,*]}
     */
    startWebpackDev($module)
    {
        if (! $module.webpack || typeof $module.webpack != 'object') {
            log.warn(`${$module.name}.webpack missing webpack config. Skipping...`);
            return;
        };

        var webpackMiddleware    = require('webpack-dev-middleware');
        var webpackHotMiddleware = require('webpack-hot-middleware');

        let compiler = webpack($module.webpack);
        let middleware = webpackMiddleware(compiler, {
            publicPath: $module.webpack.output.publicPath,
            noInfo: true,
        });
        let hotMiddleware = webpackHotMiddleware(compiler, $module.hmrOptions||{});

        // Return the middleware functions.
        return [
            function webpackDevMiddleware() {
                return middleware(...arguments);
            },
            function webpackHotMiddleware() {
                return hotMiddleware(...arguments);
            }
        ];
    }

    /**
     * Start the livereload server.
     * @param $module Module
     * @returns void
     */
    startLivereload($module)
    {
        if (this.livereloadRunning) return;

        try {
            let server = livereload.createServer(this.livereload.options);
            server.watch(this.livereload.dirs);
            app.on('view.created', function(view,request) {
                view.script('livereload', 'http://localhost:35729/livereload.js');
            });
        } catch (err) {
            log.error(err.message);
        }

        log.info('Livereload server running at http://localhost:35729');

        this.livereload.dirs.forEach(dir => {
            debug(this, 'Livereload watching path %s', dir);
        });

        this.livereloadRunning = true;
    }
}

module.exports = Development;

