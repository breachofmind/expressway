"use strict";

var Converter = require("csvtojson").Converter;
var path = require('path');
var Promise = require('bluebird');
var Expressway = require('expressway');

var msg = {
    running: "[Seeder] Running seeder: %s",
    seeding: "[Seeder] Error seeding: %s",
    parsed:  "[Seeder] Parsed Seed: %s (%d rows)",
    prepare: "[Seeder] Preparing Seed: %s",
    created: "[Seeder] Created Models: %s, %d objects",
    dumping: "[Seeder] Dumping models: %s",

    err_noModel:  "[Seeder] Error seeding, no model or data: %s",
    err_creating: "[Seeder] Error creating models: %s",
    err_dumping:  "[Seeder] Error dumping models: %s"

};



/**
 * Provides the Seeder helper.
 * @author Mike Adamczyk <mike@bom.us>
 */
class SeederProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'LoggerProvider',
            'ModelProvider'
        ];
        this.environments = [ENV_CLI];
    }

    register(app,log,Models,db)
    {
        var ObjectId = db.Schema.Types.ObjectId;

        /**
         * Seeder class.
         * A seeder contains multiple seeds.
         * @constructor
         */
        class Seeder
        {
            /**
             * Constructor.
             * @param name string
             * @param path string path to database seeds, optional
             * @returns {Seeder}
             */
            constructor(name, path)
            {
                this.name = name;
                this.reset = false;
                this.path = path || app.rootPath('db/seeds/');

                this._order = [];
                this._index = {};
            }

            /**
             * Add a new seed.
             * @param name string
             * @param datasource string|array
             * @param parse function, optional
             * @returns {Seed}
             */
            add(name, datasource, parse)
            {
                var seed = new Seed(name,datasource,parse, this);
                this._index[seed.name] = seed;
                this._order.push(seed);

                return seed;
            }

            /**
             * Parsed the CSV seed files and returns a promise when done.
             * @returns {*}
             */
            run()
            {
                log.info(msg.running, this.name);
                return this._runMethodOnOrder('prepare');
            }

            seed()
            {
                return this._runMethodOnOrder('seed');
            }

            _runMethodOnOrder(funcName)
            {
                var self = this;
                var order = this._order;

                function errorHandler(err,seed)
                {
                    log.error(msg.seeding, seed.name);
                }

                return new Promise(function(resolve,reject)
                {
                    var next = function(index){
                        return function(seed) {
                            if (!order[index]) {
                                return resolve(self, self._index);
                            }
                            order[index][funcName]().then(next(index+1)).error(errorHandler);
                        }
                    };

                    order[0][funcName]().then(next(1))
                });
            }

            /**
             * A debugging function to show all seed data.
             * @returns void
             */
            list()
            {
                this._order.forEach(function(seed) {
                    console.log(seed.name);
                    console.log(seed.data);
                });
            }

            /**
             * Get a seed by name.
             * @param seedName string
             * @returns {*}
             */
            get(seedName)
            {
                return this._index.hasOwnProperty(seedName) ? this._index[seedName] : null;
            }
        }

        /**
         * An individual seed object.
         * @constructor
         */
        class Seed
        {
            constructor(name,datasource,parse,parent)
            {
                this.name = name;
                this.path = null;
                this.seeder = null;
                this.parsed = false;
                this.seeded = false;
                this.reset = false;
                this.data = [];
                this.models = [];
                this.parse = parse || function(row,i) { return row; };
                this.model = Models[name];

                this._setup(parent,datasource);

                this._converter = new Converter({});
            }

            _setup(seeder, datasource)
            {
                this.seeder = seeder;
                this.reset = seeder.reset;
                if (typeof datasource == 'string') {
                    this.path = seeder.path + datasource;
                    return;
                }
                // datasource is an array of objects.
                this.setData(datasource);
            }


            setData(results)
            {
                for (let i=0; i<results.length; i++)
                {
                    results[i]._id = new ObjectId();
                    results[i] = this.parse(results[i], i);
                }
                this.data = results;
                this.seeder[this.name] = results;
                this.parsed = true;

                log.info(msg.parsed, this.name, results.length);

                return results;
            }

            /**
             * Parse the CSV data.
             * @returns {bluebird|exports|module.exports}
             */
            prepare()
            {
                var self = this;

                return new Promise(function(resolve,reject) {

                    if (self.parsed || !self.path) {
                        return resolve(self);
                    }
                    log.info(msg.prepare, self.path);

                    self._converter.fromFile(self.path, complete);

                    function complete(err,results)
                    {
                        if (err || ! results.length) {
                            return reject(err,self);
                        }

                        self.setData(results);

                        return resolve(self);
                    }
                });
            }

            /**
             * Set the models property with response from the server.
             * @param arr array
             * @return void
             */
            setModels(arr)
            {
                this.seeded = true;
                this.models = arr;
            }

            /**
             * Seed the database with the data contained in this seed.
             * @returns {bluebird|exports|module.exports}
             */
            seed()
            {
                var self = this;
                var model = this.model;

                return new Promise(function(resolve, reject) {

                    if (self.seeded) {
                        return resolve(self);
                    }
                    // Just move on to the next one.
                    if (! model || ! self.data.length) {
                        return error(msg.noModel)(null);
                    }

                    // User is asking to dump the database records first.
                    if (self.reset) {
                        log.info(msg.dumping, model.name);
                        model.remove().then(create, error(msg.err_dumping));
                    } else {
                        create();
                    }

                    // Standard error handler.
                    function error(message)
                    {
                        return function(err)
                        {
                            if (err) console.error(err);
                            log.error(message, self.name);
                            resolve(err);
                        }
                    }

                    // Create new models.
                    function create()
                    {
                        model.create(self.data).then(function(response) {
                            self.setModels(response);
                            log.info(msg.created, model.name, response.length);

                            resolve(self);

                        }, error(msg.err_creating));
                    }
                });
            }

        }

        app.register('Seeder', Seeder);
    }
}

module.exports = SeederProvider;