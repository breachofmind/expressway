"use strict";

var Driver = require('expressway').Driver;
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var Promise = require('bluebird');
var _ = require('lodash');

mongoose.Promise = Promise;


module.exports = function(app,config,log)
{
    return new class SequelizeDriver extends Driver
    {
        constructor()
        {
            super();

            this.types = require('./SequelizeDriverTypes');
        }

        /**
         * Get the driver name.
         * @returns {String}
         */
        get name()
        {
            return this.constructor.name;
        }

        /**
         * Connect to the mongoDB database.
         * @returns {Promise}
         */
        connect()
        {
            let credentials = config('db');

            return new Promise((resolve, reject) =>
            {
                try {
                    this.instance = new Sequelize(credentials);
                } catch(err) {
                    return reject(err);
                }

                return resolve(null);
            });
        }

        /**
         * Create the model schema and model object.
         * @param blueprint Model
         */
        boot(blueprint)
        {
            // // Unregister and re-register the models.
            // if (mongoose.models[blueprint.name]) {
            //     blueprint.fields.clear();
            //     delete mongoose.models[blueprint.name];
            //     delete mongoose.modelSchemas[blueprint.name];
            // }
            //
            // app.call(blueprint,'schema',[blueprint.fields, this.types]);
            //
            // // Create the mongoose schema.
            // let schema = new mongoose.Schema(blueprint.fields.toSchema(), {
            //     collection: blueprint.table
            // });
            //
            // // Allow the user to create hooks on the schema.
            // blueprint.hooks.forEach(fn => {
            //     fn.apply(blueprint,[schema]);
            // });
            //
            // // Attach the methods to the schema.
            // schema.methods = app.call(blueprint,'methods',[{}]);
            //
            // let model = mongoose.model(blueprint.name, schema);

            this.assign(blueprint, model);
        }

        /**
         * Instructions for assembling the schema sent to mongoose.Schema.
         * @param blueprint Model
         * @param collection FieldCollection
         * @returns {{}}
         */
        schema(blueprint,collection)
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
         * Return prototype database methods.
         * @param blueprint Model
         * @returns {*}
         */
        methods(blueprint)
        {
            let model = this.models[blueprint.name];

            return {
                model: model,
                all() {
                    return model
                        .find()
                        .populate(blueprint.populate)
                        .sort(blueprint.range)
                        .exec();
                },
                first(args) {
                    return model.findOne(args).populate(blueprint.populate).exec();
                },
                find(args) {
                    return model
                        .find(args)
                        .sort(model.range)
                        .populate(blueprint.populate);
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
            }
        }
    }
};

