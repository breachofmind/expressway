"use strict";

var Provider = require('../provider');

Provider.create('modelProvider', function(app) {

    this.requires([
        'databaseProvider'
    ]);

    var utils = app.utils;

    var db = app.db;

    var modelPath = app.rootPath('models/');

    /**
     * Model Factory class.
     * For making those mongoose models.
     */
    class ModelFactory
    {
        constructor(name,schema)
        {
            // Name of the model.
            this.name = name;

            // Column labels, optional.
            this.labels = {};

            this.guarded = [];

            this.fillable = [];

            // Model structure.
            this.fields(schema);

            // Expose to API?
            this.expose = true;

            this.title = 'id';

            // Default ranging field and sort order.
            this.range('_id',1);

            // Reference fields to populate.
            this.population = [];

            ModelFactory.store(name,this);
        }

        /**
         * Sets the schema json output.
         */
        setJsonOutput()
        {
            var blueprint = this;

            this.schema.methods.toJSON = function()
            {
                var out = {};
                var model = this;

                blueprint.fillable.forEach(function(column)
                {
                    if (typeof column == 'function') {
                        var arr = column(model,blueprint);
                        if (arr) {
                            return out[arr[0]] = arr[1];
                        }
                    }
                    if (typeof model[column] == "function") {
                        return out[column] = model[column] ();
                    }
                    // Skip fields that are in the guarded column.
                    if (blueprint.guarded.indexOf(column) > -1) {
                        return;
                    }
                    return out[column] = model[column];
                });

                out['id'] = model._id;
                out['_title'] = out[blueprint.title];
                out['_url'] = utils.url(`api/v1/${blueprint.name.toLowerCase()}/${model._id}`);

                return out;
            }
        }

        /**
         * Append a field to the fillable list
         * @param column string|function
         * @returns {ModelFactory}
         */
        appends(column)
        {
            this.fillable.push(column);

            return this;
        }

        /**
         * Guard a column from being displayed in the JSON string.
         * @param column string
         * @returns {ModelFactory}
         */
        guard(column)
        {
            this.guarded.push(column);

            return this;
        }

        /**
         * Add methods to the model.
         * @param object
         * @returns {ModelFactory}
         */
        methods(object)
        {
            for(let method in object) {
                this.schema.methods[method] = object[method];
            }

            return this;
        }

        /**
         * Set the fields on the schema.
         * @param schema object
         * @returns {ModelFactory}
         */
        fields(schema)
        {
            if (schema) {
                for (var column in schema) {
                    this.fillable.push(column);
                }
                this.schema = new db.Schema(schema);
            }
            return this;
        }

        /**
         * Set the range key and sort value.
         * @param key string
         * @param sort int
         * @returns {ModelFactory}
         */
        range(key,sort)
        {
            if (! arguments.length) {
                var out = {}; out[this.key] = this.sort;
                return out;
            }
            this.key = key;
            this.sort = sort || 1;
            this.keyType = this.schema.tree[this.key].type;
            return this;
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
         * Population settings for this model.
         * @param args array|object
         * @returns {ModelFactory}
         */
        populate(args)
        {
            this.population = args||[];
            return this;
        }

        /**
         * Assign the schema to the model.
         * @returns {ModelFactory}
         */
        build()
        {
            this.setJsonOutput();
            this.model = db.model(this.name,this.schema);

            ModelFactory[this.name] = this.model;
            app.logger.debug('Model Built: %s', this.name);

            return this;
        }

        /**
         * Load the given files.
         * @param items array|string
         * @returns {*}
         */
        static load(items)
        {
            var loaded = [];

            if (typeof items == 'string') {
                items = [items];
            }

            items.forEach(function(name)
            {
                if (ModelFactory.get(name)) {
                    loaded.push(ModelFactory.get(name));
                    return;
                }
                require(modelPath + name) (ModelFactory, app);

                loaded.push(ModelFactory.get(name));

                app.logger.debug('Loaded Model: %s', name);
            });

            return loaded.length == 1 ? loaded[0] : loaded;
        }

        /**
         * Assign the schema to all loaded models.
         * This is done at the bootstrap level.
         * @returns {void}
         */
        static build()
        {
            for(let model in ModelFactory.models) {
                ModelFactory.models[model].build();
            }
        }

        /**
         * Return a ModelFactory object.
         * @param name string
         * @returns {*|null}
         */
        static get(name)
        {
            return ModelFactory.models[name.toLowerCase()] || null;
        }

        /**
         * Return the models object.
         * @returns {{}}
         */
        static all()
        {
            return ModelFactory.models;
        }

        /**
         * Store an instance of a model blueprint in the repository.
         * @param name string
         * @param object ModelFactory
         * @returns {*}
         */
        static store(name,object)
        {
            return ModelFactory.models[name.toLowerCase()] = object;
        }

        /**
         * Named constructor.
         * @param name string
         * @param schema object
         * @returns {ModelFactory}
         */
        static create(name, schema)
        {
            return new ModelFactory(name,schema);
        }

        /**
         * Boot all created models.
         * @returns void
         */
        static boot()
        {
            var files = utils.getFileBaseNames(modelPath);

            ModelFactory.load(files);
        }
    }

    /**
     * Repository of created model blueprints.
     * @type {{}}
     */
    ModelFactory.models = {};

    ModelFactory.types = db.Schema.Types;

    ModelFactory.boot();

    // Attach the factory class to the application.
    app.ModelFactory = ModelFactory;

    // Models need to have their schema attached for use.
    app.event.on('bootstrap', function(app) {
        app.ModelFactory.build();
    });
});