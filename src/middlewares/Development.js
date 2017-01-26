"use strict";

var Middleware = require('expressway').Middleware;
var _ = require('lodash');

class Development extends Middleware
{
    get description() {
        return "Adds webpack hot module replacement to a module (ENV_LOCAL only)";
    }

    /**
     * Constructor.
     * @injectable
     * @param app Application
     * @param url URLService
     */
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
     * Have the livereload server watch a path or array of paths.
     * @param paths string|Array
     * @returns {Development}
     */
    watch(paths)
    {
        [].concat(paths).forEach(path => {
            this.livereload.dirs.push(path);
        });

        return this;
    }

    /**
     * Dispatch middleware functions to express.
     * @injectable
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
     * @injectable
     * @param extension Extension
     * @param log Winston
     * @returns {[*,*]}
     */
    startWebpackDev(extension,log,url)
    {
        if (! extension.webpack || typeof extension.webpack != 'object') {
            log.warn(`${extension.name}.webpack missing webpack config. Skipping...`);
            return;
        };

        var webpack              = require('webpack');
        var webpackMiddleware    = require('webpack-dev-middleware');
        var webpackHotMiddleware = require('webpack-hot-middleware');

        var middleware,hotMiddleware;
        var publicPath = extension.webpack.output.publicPath;

        try {
            let compiler = webpack(extension.webpack.configuration);
            middleware = webpackMiddleware(compiler, {
                publicPath: publicPath,
                noInfo: !extension.webpack.showErrors,
            });
            hotMiddleware = webpackHotMiddleware(compiler, {
                //path: extension.webpack.output.publicPath
            });

        } catch(err) {
            log.warn('Error loading webpack: %s', extension.name);
            return;
        }


        log.info('HMR watching %s', publicPath);

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
     * @injectable
     * @param extension Extension
     * @param app Application
     * @param log Winston
     * @param debug Function
     * @returns void
     */
    startLivereload(extension,app,log,debug)
    {
        if (this.livereloadRunning) return;

        var livereload = require('livereload');

        // We don't want this to fire if we're in a CLI session.
        // But, we do want to see the middleware.
        if (app.context == CXT_WEB)
        {
            try {
                let server = livereload.createServer(this.livereload.options);
                server.watch(this.livereload.dirs);
            } catch (err) {
                log.error(err.message);
            }

            this.livereload.dirs.forEach(dir => {
                debug('Livereload watching path %s', dir);
            });

            log.info('Livereload server running at http://localhost:35729');

            app.on('view.render', function(view) {
                view.script('livereload', 'http://localhost:35729/livereload.js');
            });

            this.livereloadRunning = true;
        }
    }
}

module.exports = Development;

