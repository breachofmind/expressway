"use strict";

var Expressway   = require('expressway');
var app          = Expressway.instance.app;
var mongoose     = require('mongoose');
var session      = require('express-session');
var MongoStore   = require('connect-mongo')(session);

mongoose.Promise = require('bluebird');

class MongoDriver extends Expressway.Driver
{
    /**
     * Register the driver with the application.
     * @param provider ModelProvider
     * @returns {Driver}
     */
    register(provider)
    {
        var log = this.app.get('log');
        var event = this.app.get('event');

        mongoose.connection.on('error', function(err){
            log.error('[Database] Connection error: %s', err.message);
            process.exit(0);
        });

        mongoose.connection.on('open', function(){
            log.debug('[Database] Connected to MongoDB: %s', app.config.db);
            event.emit('database.connected', app);
        });

        event.on('application.destruct', function(){
            mongoose.disconnect();
            log.debug('[Database] Connection closed.');
        });

        mongoose.connect(this.app.config.db);

        this.app.register('db', mongoose);

        return this;
    }

    /**
     * Return the session storage solution.
     * @returns {*}
     */
    getSessionStore()
    {
        var db = this.app.get('db');
        return new MongoStore({
            mongooseConnection: db.connection
        })
    }
}


/**
 * The mongo model.
 * @author Mike Adamczyk <mike@bom.us>
 */
class MongoModel extends Expressway.BaseModel
{
    constructor(app) {
        super(app);

        this.Types = this.db.Schema.Types;
    }

    get(args) {
        return this._model.find(args).populate(this.populate).sort(this.range).exec().then(function(modelArray) {
            return this.collection(modelArray);
        }.bind(this));
    }

    find(args) {
        return this._model.find(args).populate(this.populate).sort(this.range);
    }

    findOne(args) {
        return this._model.findOne(args);
    }

    findById(id) {
        return this._model.findById(id).populate(this.populate);
    }

    findByIdAndUpdate(id,data,args)
    {
        return this._model.apply(this._model,arguments);
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
        this.fillable = Object.keys(object);
        this._schema = new this.db.Schema(object);
    }

    /**
     * Sets up the toJSON method.
     * @private
     */
    _setToJSON()
    {
        var Class = this;

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
        this.schema.methods = this.methods;
        this._model = this.db.model(this.name, this.schema);

        return super.boot();
    }
}

module.exports = new MongoDriver(app, MongoModel);