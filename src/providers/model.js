"use strict";
var _           = require('lodash');
var expressway  = require('expressway');
var Provider    = expressway.Provider;
var utils       = expressway.utils;

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
     * Perform a callback against each stored model.
     * @param callback function
     * @returns {Array}
     */
    this.each = function(callback)
    {
        return Object.keys(models).map(function(name) {
            callback(models[name]);
        });
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
            if (models.hasOwnProperty(name) && models[name].slug === slug) {
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
        var self = this;
        var schema = null;

        /**
         * The model name.
         * @type {string}
         */
        this.name = name;

        /**
         * The model name as a slug, useful for URL's.
         * @type {string}
         */
        this.slug = _.snakeCase(name);

        /**
         * The title property of the model.
         * Defaults to the 'id' property.
         * @type {string}
         */
        this.title = "id";

        /**
         * Expose this model to the public API?
         * If false, user will need to log in to see this model in the API.
         * @type {boolean}
         */
        this.expose = true;

        /**
         * Is this model owned by a user?
         * If a property is specified (ie, user_id or author_id),
         * the user will need a special permission to manage other models of this type.
         * Otherwise, they may only manage their own models of this type.
         * @type {boolean|string}
         */
        this.managed = false;

        /**
         * Guarded properties, which are not displayed as JSON.
         * @type {Array}
         */
        this.guarded = [];

        /**
         * Fillable properties, which are displayed as JSON.
         * @type {Array}
         */
        this.fillable = [];

        /**
         * Properties or functions that are appended to the JSON output.
         * @type {Array}
         */
        this.appends = [];

        /**
         * Properties that should be populated as references (MongoDB)
         * @type {Array}
         */
        this.populate = [];

        /**
         * Labels for properties (optional)
         * @type {{}}
         */
        this.labels = {};

        /**
         * Sorting key, for range-based pagination.
         * @type {string}
         */
        this.key = "id";

        /**
         * Sorting direction, for range-based pagination.
         * @type {number} 1|-1
         */
        this.sort = 1;

        /**
         * The ORM Model.
         * @type {null|Model}
         */
        this.model = null;


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

                    return out[column] = typeof model[column] == 'undefined' ? null : model[column];
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
                out['_url'] = app.url(`api/v1/${self.slug}/${model._id}`);

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

        // Assign the ORM model.
        this.model = db.model(this.name, schema);
    }

    this.Model = Model;
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
        expressway.Model = factory;
        app.ModelFactory = factory;

        /**
         * alias to Return the Model object.
         * @param name string
         * @returns {null}
         */
        expressway.model = function(name) {
            return factory.object(name);
        };

        factory.load(utils.getModules(modelPath));

        app.event.emit('models.loaded',app,factory);
    }
}

module.exports = new ModelProvider();