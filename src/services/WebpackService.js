"use strict";

var _ = require('lodash');
var path = require('path');

module.exports = function(app,extension,paths,url)
{
    var webpack = require('webpack');
    var ExtractTextPlugin = require("extract-text-webpack-plugin");

    return extension.webpack = new class WebpackService
    {
        constructor()
        {
            this.resourcePathName = "resources";

            this.config = {};
            this.entries = {};
            this.output = {
                path: extension.routes.statics[0].path,
                publicPath: url.get(extension.routes.statics[0].uri),
                filename: '[name].bundle.js',
                chunkFilename: "[id].js"
            };
            this.resolve = {
                alias: {}
            };
            this.devtool = "cheap-module-sourcemap";
            this.loaders = {};
            this.plugins = [];

            this.extractCSS = "[name].css";
            this.hmr = app.env === ENV_LOCAL;
            this.showErrors = app.env === ENV_LOCAL;

            this.readPackage(extension.package);
        }

        /**
         * Add a plugin object.
         * @param object
         * @returns {WebpackService}
         */
        plugin(object)
        {
            this.plugins.push(object);

            return this;
        }

        /**
         * Given an NPM package, add loaders based on the configuration.
         * @param npmPackage
         * @returns {WebpackService}
         */
        readPackage(npmPackage)
        {
            if (! npmPackage) return;

            var has = function(pkg) {
                return npmPackage.dependencies.hasOwnProperty(pkg)
                    || npmPackage.devDependencies.hasOwnProperty(pkg);
            };

            if (has('vue'))
            {
                this.resolve.alias['vue$'] = 'vue/dist/vue.common.js';
                this.loader('vue', {loaders: ['vue-loader']})
            }

            if (has('babel-loader'))
            {
                this.loader('js', {
                    loader: "babel-loader",
                    exclude: /(node_modules|bower_components)/,
                    query: {
                        cacheDirectory:true,
                        presets: ['es2015']
                    }
                });
            }

            if (has('sass-loader'))
            {
                let config = {outputStyle: app.env == ENV_LOCAL ? "expanded" : "compressed"};
                let loaders = has('postcss-loader') ? ['postcss-loader', 'sass-loader'] : ['sass-loader'];
                let opts = this.extractCSS
                    ? {loader: ExtractTextPlugin.extract("style-loader", ['css-loader'].concat(loaders))}
                    : {loaders: ['style-loader','css-loader'].concat(loaders)};

                this.loader('scss', opts, {sassLoader:config});
            }
            return this;
        }

        /**
         * Create an entry file.
         * @param file string
         * @param opts {Array}
         * @returns {WebpackService}
         */
        entry(file,opts)
        {
            let object = paths.build[this.resourcePathName](['js',file]);
            let middleware = this.hmr
                ? [
                    'webpack/hot/dev-server',
                    'webpack-hot-middleware/client?path='+url.get('__webpack_hmr'),
                ]
                : [];

            if (! opts) opts = object.toString();
            this.entries[path.basename(object.basename,".js")] = middleware.concat(opts);

            return this;
        }

        /**
         * Add a loader
         * @param ext string
         * @param opts object
         * @param config object
         * @returns {WebpackService}
         */
        loader(ext,opts={},config={})
        {
            let loader = {
                test: new RegExp(`\.${ext}$`)
            };
            this.loaders[ext] = _.assign(loader,opts);
            _.assign(this.config, config);

            return this;
        }

        /**
         * Get the plugins based on the configuration settings.
         * @returns {Array}
         * @private
         */
        _getPlugins()
        {
            let plugins = this.plugins;

            if (app.env == ENV_PROD) {
                plugins.push(new webpack.DefinePlugin({
                    'process.env': {NODE_ENV: '"production"'}
                }));
            }
            if (! this.showErrors) {
                plugins.push(new webpack.NoErrorsPlugin());
            }
            if (this.hmr) {
                plugins.push(new webpack.optimize.OccurenceOrderPlugin());
                plugins.push(new webpack.HotModuleReplacementPlugin());
            }
            if (this.extractCSS) {
                plugins.push(new ExtractTextPlugin(this.extractCSS));
            }
            return plugins;
        }

        /**
         * Convert the object into a webpack config.
         * @returns {Object}
         */
        toJSON()
        {
            return _.assign({}, this.config, {
                entry: this.entries,
                output: this.output,
                devtool: this.devtool,
                resolve: this.resolve,
                module: {
                    loaders: _.map(this.loaders, (value,key) => { return value })
                },
                plugins: this._getPlugins()
            })
        }

        /**
         * Load files into the view object.
         * @param view View
         */
        loadBundles(view)
        {
            let files = this.files;
            if (files.js) {
                files.js.forEach((file,index) => { view.script("jsBundle_"+index, file) });
            }
            if (files.css) {
                files.css.forEach((file,index) => { view.style("cssBundle_"+index, file) });
            }
        }

        get files()
        {
            let out = {};
            out.js = _.map(this.entries, (value,name) => {
                return this.output.publicPath + rename(this.output.filename, name);
            });
            if (this.extractCSS) {
                out.css = _.map(this.entries, (value,name) => {
                    return this.output.publicPath + rename(this.extractCSS, name);
                });
            }
            return out;
        }

        /**
         * Alias of toJSON
         * @returns {Object}
         */
        get configuration()
        {
            return this.toJSON();
        }
    }
};

function rename(input,name)
{
    return input.replace("[name]",name);
}