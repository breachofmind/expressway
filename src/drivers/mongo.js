"use strict";

var expressway   = require('expressway');
var BaseModel    = require('../model');
var mongoose     = require('mongoose');
mongoose.Promise = require('bluebird');


function MongoDriver(app,db)
{
    return class MongoModel extends BaseModel
    {
        constructor(app) {
            super(app);

            this.Types = db.Schema.Types;
        }

        get(args) {
            return this._model.find(args).populate(this.populate).sort(this.range).exec().then(function(modelArray) {
                return this.collection(modelArray);
            }.bind(this));
        }

        find(args) {
            return this._model.find(args).populate(this.populate).sort(this.range);
        }

        findById(id) {
            return this._model.findById(id).populate(this.populate);
        }

        count(args) {
            return this._model.count(args);
        }

        remove(args) {
            return this._model.remove(args);
        }

        create(args) {
            return this._model.create(args);
        }

        update(args) {
            return this._model.update(args);
        }

        /**
         * Get the schema.
         * @returns {*}
         */
        get schema()
        {
            return this._schema;
        }

        /**
         * Set the schema.
         * @param object
         */
        set schema(object)
        {
            this._schema = new db.Schema(object);
        }

        /**
         * Sets up the toJSON method.
         * @private
         */
        _setToJSON()
        {
            var Class = this;
            var app = this._app;

            this.methods.toJSON = function()
            {
                var out = {};
                var model = this;

                Class.fillable.forEach(function(column)
                {
                    // Skip fields that are in the guarded column.
                    if (Class.guarded.indexOf(column) > -1) {
                        return;
                    }

                    return out[column] = typeof model[column] == 'undefined' ? null : model[column];
                });

                // The developer can append other columns to the output.
                Class.appends.forEach(function(column)
                {
                    if (typeof column == 'function') {
                        var arr = column(model,Class);
                        if (arr) {
                            return out[arr[0]] = arr[1];
                        }
                    }
                    if (typeof model[column] == "function") {
                        return out[column] = model[column] ();
                    }
                });

                out['id'] = model._id;
                out['_title'] = out[Class.title];
                out['_url'] = app.url(`api/v1/${Class.slug}/${model._id}`);

                return out;
            }
        }
        /**
         * When booting, create the database model for mongoose.
         * @returns boolean
         */
        boot()
        {
            this._setToJSON();
            this._model = db.model(this.name, this.schema);

            return super.boot();
        }
    }
}

class MongoDriverProvider extends expressway.Provider
{
    constructor()
    {
        super('mongo');

        this.requires('logger');

        this.inject(['Log','Event']);
    }

    register(app,logger,event)
    {
        mongoose.connection.on('error', function(err){
            logger.error('[Database] Connection error: %s', err.message);
            process.exit(0);
        });

        mongoose.connection.on('open', function(){
            logger.debug('[Database] Connected to MongoDB: %s', app.config.db);
            event.emit('database.connected', app);
        });

        event.on('application.destruct', function(){
            mongoose.disconnect();
            logger.debug('[Database] Connection closed.');
        });

        mongoose.connect(app.config.db);

        app.register('db', mongoose);
        expressway.Model = MongoDriver(app,mongoose);
        app.register('Model', expressway.Model);
    }
}

module.exports = new MongoDriverProvider();