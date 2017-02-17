"use strict";

var mongoose    = require('mongoose');
var session     = require('express-session');
var MongoStore  = require('connect-mongo')(session);
var Promise     = require('bluebird');
var _           = require('lodash');
var ObjectId    = mongoose.Types.ObjectId;

const MONGODB_PORT = 27017;

mongoose.Promise = Promise;


module.exports = function(app,config,log)
{
    var Driver      = require('../Driver');
    var driverTypes = require('./MongooseDriverTypes');

    /**
     * Return a new instance of the Mongoose driver.
     * @returns {MongooseDriver}
     */
    return new class MongooseDriver extends Driver
    {
        /**
         * Get the driver name.
         * @returns {String}
         */
        get name()
        {
            return this.constructor.name;
        }

        /**
         * Return the field types for this driver.
         * @returns {Object}
         */
        get types()
        {
            return driverTypes;
        }

        /**
         * Get the mongoose db instance.
         * @returns {mongoose}
         */
        get db()
        {
            return mongoose;
        }

        /**
         * Connect to the mongoDB database.
         * @returns {Promise}
         */
        connect()
        {
            let db = config('db');
            let uri = MongooseDriver.getConnectionUri(db);

            // This should tell the Session middleware which store to use.
            app.emit('database.boot',mongoose,MongoStore);

            return new Promise((resolve, reject) =>
            {
                mongoose.connection.on('error', err => {
                    log.error('MongoDriver connection error: %s on %s', err.message, uri);
                    reject(err);
                });
                mongoose.connection.on('open', () => {
                    log.info('MongoDriver connected: %s', uri);
                    resolve(null);
                });

                mongoose.connect(uri);
            });
        }

        /**
         * Create the model schema and model object.
         * @param blueprint Model
         */
        boot(blueprint)
        {
            // Unregister and re-register the models.
            if (mongoose.models[blueprint.name]) {
                blueprint.fields.clear();
                delete mongoose.models[blueprint.name];
                delete mongoose.modelSchemas[blueprint.name];
            }

            app.call(blueprint,'schema',[blueprint.fields, this.types]);

            // Create the mongoose schema.
            let schema = new mongoose.Schema(this._fieldCollectionToSchema(blueprint.fields), {
                collection: blueprint.table
            });

            // Allow the user to create hooks on the schema.
            blueprint.hooks.forEach(fn => {
                fn.apply(blueprint,[schema]);
            });

            // Attach the methods to the schema.
            schema.methods = app.call(blueprint,'methods',[{}]);

            let model = mongoose.model(blueprint.name, schema);

            this.assign(blueprint, model);
        }

        /**
         * Instructions for assembling the schema sent to mongoose.Schema.
         * @param collection FieldCollection
         * @returns {{}}
         */
        _fieldCollectionToSchema(collection)
        {
            let out = {};

            function getFieldSchema(field)
            {
                if (field.child) {
                    return [ getFieldSchema(field.child) ];
                }
                let args = {type: field.type};
                _.each(['unique','required'], property => {
                    if (field[property] === true) args[property] = true;
                });
                if (field.indexed) args.index = true;
                if (field.default !== undefined) args['default'] = field.default;
                if (typeof field.ref == 'string') args['ref'] = field.ref;

                return args;
            }

            collection.each(field =>
            {
                out[field.name] = getFieldSchema(field);
            });

            return out;
        }

        /**
         * When seeding an object, ID's are created with this method.
         * @param row
         * @param i
         * @returns {*}
         */
        newId(row,i)
        {
            return new ObjectId;
        }

        /**
         * Return prototype database methods.
         * @param blueprint Model
         * @param model mongooseModel
         * @returns {*}
         */
        methods(blueprint,model)
        {
            let methods = {
                all(args={}) {
                    return model
                        .find(args)
                        .populate(blueprint.populate)
                        .sort(blueprint.range)
                        .exec();
                },
                first(args) {
                    return model.findOne(args).populate(blueprint.populate).exec();
                },
                find(args) {
                    return model.find(args);
                },
                findById(id) {
                    return model
                        .findById(id)
                        .populate(blueprint.populate)
                        .exec();
                },
                count(args) {
                    return model.count(args);
                },
                create(args) {
                    return model.create(args);
                },
                update(args) {
                    return model.update(args);
                },
                delete(args) {
                    return model.remove(args);
                }
            };

            return _.assign({},super.methods(blueprint,model), methods);
        }

        /**
         * Given the db object, convert to a connection uri string.
         * @param db {Object}
         * @returns {string}
         */
        static getConnectionUri(db)
        {
            let arr = ['mongodb://'];
            if (db.username) arr.push(`${db.username}:${db.password}@`);
            arr.push(db.hostname);
            arr.push(":" + (db.port || MONGODB_PORT));
            arr.push("/"+db.database);

            return arr.join("");
        }
    }
};

