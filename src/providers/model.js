"use strict";
var _ = require('lodash');
var mvc = require('../../index');
var Provider = mvc.Provider;
var utils = mvc.utils;

/**
 * Model factory class.
 * Assists with creating blueprints of models
 * and links them to their ORM (mongoose, in this case)
 *
 * @param app Application
 * @constructor
 */
function ModelFactory(app)
{
    var models = {};
    var db = app.db;

    this.types = db.Schema.Types;

    /**
     * Load model files.
     * @param files array|string
     * @returns {{}}
     */
    this.load = function(files)
    {
        if (! Array.isArray(files)) files = [files];

        files.forEach(function(file)
        {
            var model = require(file);
            if (model instanceof Model) {
                models[model.name] = model;
                app.logger.debug('[Model] Loaded: %s', model.name);

                return true;
            }

            throw (file+" does not contain an instance of a Model");
        });

        return models;
    };

    /**
     * Create new Model instance.
     * @param name string
     * @param boot function
     * @returns {Model}
     */
    this.create = function(name,boot)
    {
        return new Model(name, boot);
    };

    /**
     * Check if the factory has the given model name.
     * @param name string
     * @returns {boolean}
     */
    this.has = function(name)
    {
        return models.hasOwnProperty(name);
    };

    /**
     * Retrieve a model instance or all models.
     * @param name string
     * @returns {object|Model}
     */
    this.get = function(name)
    {
        if (! arguments.length) {
            return models;
        }
        return this.has(name) ? models[name] : null;
    };

    /**
     * Returns a Model's mongoose model.
     * @param name string
     * @returns {null}
     */
    this.object = function(name)
    {
        return this.has(name) ? this.get(name).model : null;
    };

    /**
     * Return a Model instance by the slug name.
     * Useful for use in getting a model in a URL string.
     * @param slug string
     * @returns {*}
     */
    this.bySlug = function(slug)
    {
        for (let name in models) {
            if (models[name].slug === slug) {
                return models[name];
            }
        }
        return null;
    };

    /**
     * The Model class.
     * @param name string
     * @param boot function
     * @constructor
     */
    function Model(name,boot)
    {
        var self    = this;
        var schema  = null;

        this.name     = name;
        this.slug     = _.snakeCase(name);
        this.title    = "id";
        this.expose   = true;
        this.guarded  = [];
        this.fillable = [];
        this.appends  = [];
        this.populate = [];
        this.labels   = {};
        this.key      = "id";
        this.sort     = 1;
        this.model    = null;

        Object.defineProperties(this, {

            /**
             * Get the sorting range.
             * @returns {{}}
             */
            range: {
                get: function() {
                    var out = {}; out[self.key] = self.sort;
                    return out;
                }
            },

            /**
             * Set the model schema.
             * @param object
             */
            schema: {
                get: function() {
                    return schema;
                },
                set: function(object) {
                    self.fillable = Object.keys(object);
                    schema = new db.Schema(object);
                }
            },

            /**
             * Set the schema methods.
             * @param object
             */
            methods: {
                get: function() {
                    return schema.methods;
                },
                set: function(object) {
                    schema.methods = object;
                }
            },

            /**
             * Return the key type for sorting.
             * @returns {*}
             */
            keyType: {
                get: function() {
                    return schema.tree[self.key].type;
                }
            }

        });

        /**
         * Sets the schema json output.
         * @returns void
         */
        function setJsonMethod()
        {
            this.methods.toJSON = function()
            {
                var out = {};
                var model = this;

                self.fillable.forEach(function(column)
                {
                    // Skip fields that are in the guarded column.
                    if (self.guarded.indexOf(column) > -1) {
                        return;
                    }
                    return out[column] = model[column];
                });

                // The developer can append other columns to the output.
                self.appends.forEach(function(column)
                {
                    if (typeof column == 'function') {
                        var arr = column(model,self);
                        if (arr) {
                            return out[arr[0]] = arr[1];
                        }
                    }
                    if (typeof model[column] == "function") {
                        return out[column] = model[column] ();
                    }
                });

                out['id'] = model._id;
                out['_title'] = out[self.title];
                out['_url'] = app.url(`api/v1/${self.name.toLowerCase()}/${model._id}`);

                return out;
            }
        }


        /**
         * Return an object for a filter query.
         * @param value string from ?p
         * @returns {{}}
         */
        this.paging = function(value)
        {
            var q = {};
            q[this.key] = this.sort == 1
                ? {$gt:value}
                : {$lt:value};
            return q;
        };

        // Constructor
        boot.call(this, app);
        setJsonMethod.call(this);
        this.model = db.model(this.name, schema);
    }
}


/**
 * Provides mongoose model blueprints.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Provider
{
    constructor()
    {
        super('model');

        this.requires([
            'database',
            'url'
        ]);
    }

    register(app)
    {
        var modelPath = app.rootPath(app.conf('models_path',' models') + "/");

        var factory = new ModelFactory(app);

        // Expose the factory class.
        mvc.Model = factory;
        app.ModelFactory = factory;

        factory.load(utils.getModules(modelPath));

        app.event.emit('models.loaded',app,factory);
    }
}

module.exports = new ModelProvider();