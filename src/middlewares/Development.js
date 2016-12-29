"use strict";

var Middleware = require('expressway').Middleware;
var webpack    = require('webpack');
var livereload = require('livereload');

class Development extends Middleware
{
    get description() {
        return "Adds webpack hot module replacement to a module (ENV_LOCAL only)";
    }

    constructor(app,url)
    {
        super(app);

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
                originalPath: url.get(),
                exts: ['htm','html','ejs','hbs','png','gif','jpg','css'],
            }
        };

        app.service('devMiddleware', this);
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
     * @param extension Extension
     * @returns {(*|*)[]}
     */
    dispatch(extension)
    {
        if (this.app.env !== ENV_LOCAL) return;

        return [
            this.app.call(this,'startLivereload',[extension]),
            this.app.call(this,'startWebpackDev',[extension])
        ];
    }

    /**
     * Start the webpack hot middleware dev server.
     * @param extension Extension
     * @param log Winston
     * @returns {[*,*]}
     */
    startWebpackDev(extension,log)
    {
        if (! extension.webpack || typeof extension.webpack != 'object') {
            log.warn(`${extension.name}.webpack missing webpack config. Skipping...`);
            return;
        };

        var webpackMiddleware    = require('webpack-dev-middleware');
        var webpackHotMiddleware = require('webpack-hot-middleware');

        let compiler = webpack(extension.webpack);
        let middleware = webpackMiddleware(compiler, {
            publicPath: extension.webpack.output.publicPath,
            noInfo: true,
        });
        let hotMiddleware = webpackHotMiddleware(compiler, extension.hmrOptions||{});

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
     * @param extension Extension
     * @param app Application
     * @param log Winston
     * @param debug Function
     * @returns void
     */
    startLivereload(extension,app,log,debug)
    {
        if (this.livereloadRunning) return;

        try {
            let server = livereload.createServer(this.livereload.options);
            server.watch(this.livereload.dirs);
        } catch (err) {
            log.error(err.message);
        }

        log.info('Livereload server running at http://localhost:35729');

        this.livereload.dirs.forEach(dir => {
            debug('Livereload watching path %s', dir);
        });

        this.livereloadRunning = true;

        return function(request,response,next) {
            response.view.script('livereload', 'http://localhost:35729/livereload.js');
            next();
        }
    }
}

module.exports = Development;

