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
            this.entries = {
                vendor: []
            };
            this.output = {
                path: extension.routes.statics[0].path,
                publicPath: url.get(extension.routes.statics[0].uri),
                filename: '[name].js',
                chunkFilename: 'chunk.[id].js'
            };
            this.resolve = {
                alias: {}
            };
            this.devtool = "cheap-module-sourcemap";
            this.loaders = {};
            this.plugins = [];

            this.hmr        = app.env === ENV_PROD ? false : this.output.publicPath;
            this.uglify     = app.env === ENV_PROD;
            this.extractCSS = "[name].css";
            this.showErrors = false;
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
            if (! npmPackage.dependencies) npmPackage.dependencies = {};
            if (! npmPackage.devDependencies) npmPackage.devDependencies = {};
            var has = function(pkg) {
                return npmPackage.dependencies.hasOwnProperty(pkg)
                    || npmPackage.devDependencies.hasOwnProperty(pkg);
            };

            if (has('vue'))
            {
                let config = {
                    loaders: {js:'babel-loader'}
                };
                this.resolve.alias['vue$'] = 'vue/dist/vue.common.js';
                this.loader('vue', {loaders: ['vue-loader']}, {vue: config})
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
        entry(file,opts=[])
        {
            let object = paths.build[this.resourcePathName](['js',file]);
            let name = path.basename(object.basename,".js");
            this.entries[name] = opts.concat(object.toString());

            return this;
        }

        common(packages)
        {
            this.entries["vendor"] = this.entries["vendor"].concat(packages);
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
         * Load files into the view object.
         * @param view View
         */
        loadBundles(view)
        {
            let files = this.files;
            files.js.forEach((file,index) => { view.script("jsBundle_"+index, file) });
            files.css.forEach((file,index) => { view.style("cssBundle_"+index, file) });
        }

        /**
         * Get the file output bundles.
         * @returns {{}}
         */
        get files()
        {
            let out = {js: [], css: []};

            out.js = out.js.concat(_.map(this.entries, (value,name) => {
                return this.output.publicPath + rename(this.output.filename, name);
            }));
            if (this.extractCSS) {
                out.css = _.compact(_.map(this.entries, (value,name) => {
                    if (name === 'vendor') return;
                    return this.output.publicPath + rename(this.extractCSS, name);
                }));
            }
            return out;
        }

        /**
         * Get the plugins based on the configuration settings.
         * @returns {Array}
         * @private
         */
        _getPlugins()
        {
            let plugins = [];

            if (app.env == ENV_PROD) {
                plugins.push(new webpack.DefinePlugin({
                    'process.env': {NODE_ENV: '"production"'}
                }));
            }
            if (! this.showErrors) {
                plugins.push(new webpack.NoErrorsPlugin());
            }
            if (this.entries.vendor.length) {
                plugins.push(new webpack.optimize.CommonsChunkPlugin({
                    name: "vendor",
                    filename: "vendor.js"
                }));
            }
            if (this.hmr) {
                plugins.push(new webpack.optimize.OccurenceOrderPlugin());
                plugins.push(new webpack.HotModuleReplacementPlugin());
            }
            if (this.uglify) {
                plugins.push(new webpack.optimize.UglifyJsPlugin(typeof this.uglify == 'object' ? this.uglify : {}));
            }
            if (this.extractCSS) {
                plugins.push(new ExtractTextPlugin(this.extractCSS));
            }

            return this.plugins.concat(plugins);
        }

        /**
         * Get the entry objects.
         * @returns {{}}
         * @private
         */
        _getEntries()
        {
            let out = {};
            _.each(this.entries, (arr,name) => {
                let middleware = arr;
                if (this.hmr && name !== 'vendor') {
                    middleware = [
                        'webpack/hot/dev-server',
                        `webpack-hot-middleware/client?name=${name}&path=${this.hmr}__webpack_hmr`,
                    ].concat(arr);
                }
                out[name] = middleware;
            });
            return out;
        }

        /**
         * Get the module loaders object.
         * @returns {{loaders: (*|Array)}}
         * @private
         */
        _getLoaders()
        {
            return {
                loaders: _.map(this.loaders, (value,key) => {
                    return value;
                })
            }
        }

        /**
         * Convert the object into a webpack config.
         * @returns {Object}
         */
        toJSON()
        {
            return _.assign({}, this.config, {
                entry: this._getEntries(),
                output: this.output,
                devtool: this.devtool,
                resolve: this.resolve,
                module: this._getLoaders(),
                plugins: this._getPlugins()
            })
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

/**
 * For renaming the input file
 * @param input
 * @param name
 * @returns {string}
 */
function rename(input,name)
{
    return input.replace("[name]",name);
}