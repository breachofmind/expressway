"use strict";
var _ = require('lodash');
var mvc = require('../../index');
var Provider = mvc.Provider;
var utils = mvc.utils;

class ModelFactory
{
    constructor(app)
    {
        this.app = app;
        this.models = {};
        this.types = app.db.Schema.Types;
    }

    load(files)
    {
        if (! Array.isArray(files)) files = [files];

        files.forEach(function(file)
        {
            var model = require(file);
            if (model instanceof Model) {
                this.models[model.name] = model;
                this.app.logger.debug('[Model] Loaded: %s', model.name);
            }

        }.bind(this));

        return this.models;
    }

    create(name,boot)
    {
        return new Model(name, boot, this);
    }

    has(name)
    {
        return this.models.hasOwnProperty(name);
    }

    get(name)
    {
        if (! arguments.length) {
            return this.models;
        }
        return this.has(name) ? this.models[name] : null;
    }

    object(name)
    {
        return this.has(name) ? this.get(name).model : null;
    }

    bySlug(slug)
    {
        for (let name in this.models) {
            if (this.models[name].slug === slug) {
                return this.models[name];
            }
        }
        return null;
    }
}

class Model
{
    constructor(name,boot,factory)
    {
        this._schema = null;
        this._factory = factory;
        this._app = factory.app;
        this._db = factory.app.db;

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

        boot.call(this, this._app);

        this.build();
    }

    build()
    {
        this._setJsonMethod();
        this.model = this._db.model(this.name, this._schema);

        return this;
    }

    /**
     * Get the sorting range.
     * @returns {{}}
     */
    get range()
    {
        var out = {}; out[this.key] = this.sort;
        return out;
    }

    /**
     * Set the model schema.
     * @param object
     */
    set schema(object) {
        this.fillable = Object.keys(object);
        this._schema = new this._db.Schema(object);
    }

    /**
     * Get the model schema.
     * @returns {*}
     */
    get schema() {
        return this._schema;
    }

    /**
     * Set the schema methods.
     * @param object
     */
    set methods(object) {
        this._schema.methods = object;
    }

    /**
     * Get the schema methods.
     * @returns {*}
     */
    get methods() {
        return this._schema.methods;
    }

    /**
     * Get the datatype for this key.
     * @returns {*}
     */
    get keyType() {
        return this._schema.tree[this.key].type;
    }

    /**
     * Return an object for a filter query.
     * @param value string from ?p
     * @returns {{}}
     */
    paging(value)
    {
        var q = {};
        q[this.key] = this.sort == 1
            ? {$gt:value}
            : {$lt:value};
        return q;
    }

    /**
     * Sets the schema json output.
     * @private
     * @returns void
     */
    _setJsonMethod()
    {
        var self = this;

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
            out['_url'] = self._app.url(`api/v1/${self.name.toLowerCase()}/${model._id}`);

            return out;
        }
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

        factory.load(utils.getFileBaseNames(modelPath).map(function(file) {
            return modelPath + file;
        }));

        app.event.emit('models.loaded',app,factory);
    }
}

module.exports = new ModelProvider();