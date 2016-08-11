"use strict";

var Converter = require("csvtojson").Converter;
var path = require('path');
var Provider = require('../provider');
var Promise = require('bluebird');

Provider.create('seederProvider', function() {

    this.requires([
        'loggerProvider',
        'databaseProvider',
        'modelProvider'
    ]);

    return function(app)
    {
        var ObjectId = app.db.Types.ObjectId;
        var event = app.event;
        var logger = app.logger;

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
                this.path = path || app.rootPath('db/seeds/');

                this._order = [];
                this._index = {};
            }

            /**
             * Add a new seed.
             * @param name string
             * @param file string
             * @param parse function, optional
             * @returns {Seed}
             */
            add(name, file, parse)
            {
                var filepath = this.path + file;
                var seed = new Seed(name,filepath,parse);
                seed.setParent(this);

                return seed;
            }

            /**
             * Parsed the CSV seed files and returns a promise when done.
             * @returns {*}
             */
            run()
            {
                logger.debug('[Seeder] Running seeder: %s', this.name);
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
                    logger.error("Error seeding: %s", seed.name);
                }

                return new Promise(function(resolve,reject)
                {
                    var next = function(index){
                        return function(seed) {
                            if (!order[index]) {
                                return resolve(self);
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
                if (this._index[seedName] >= 0) {
                    return this._order[ this._index[seedName] ]
                }
                return null;
            }

            /**
             * Named constructor.
             * @param name string
             * @param path string path to database seeds, optional
             * @returns {Seeder}
             */
            static create(name,path)
            {
                return new Seeder(name,path);
            }
        }

        /**
         * An individual seed object.
         * @constructor
         */
        class Seed
        {
            constructor(name,path,parse)
            {
                this.name = name;
                this.path = path;
                this.parse = parse || function(row,i) { return row; };
                this.seeder = null;
                this.parsed = false;
                this.seeded = false;
                this.reset = false;
                this.data = [];
                this.models = [];
                this.blueprint = app.ModelFactory.get(name);
                this.model = this.blueprint ? this.blueprint.model : null;

                this._converter = new Converter({});
            }

            /**
             * Set the parent seeder.
             * @param seeder Seeder|null
             * @returns Seeder|null
             */
            setParent(seeder)
            {
                if (seeder instanceof Seeder) {
                    seeder._index[this.name] = (seeder._order.push(this)-1);
                    this.seeder = seeder;
                } else {
                    throw ('Parent for a seed must be a Seeder object.');
                }
                return this.seeder;
            }

            setData(results)
            {
                for (let i=0; i<results.length; i++)
                {
                    results[i]._id = new ObjectId();
                    results[i] = this.parse(results[i], i);
                }
                this.data = results;
                this.parsed = true;

                logger.debug('[Seeder] Parsed Seed: %s (%d rows)', this.name, results.length);

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

                    logger.debug ('[Seeder] Preparing Seed: %s', self.path);

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

                return new Promise(function(resolve, reject) {

                    // Just move on to the next one.
                    if (! self.model || ! self.data.length) {
                        return error("No model or data for seed");
                    }

                    // There was an error.
                    function error(message)
                    {
                        return function(){
                            logger.error("[Seeder] "+message+': %s', self.name);
                            resolve(self);
                        }
                    }

                    // Create new models.
                    function create()
                    {
                        self.model.create(self.data).then(function(response) {
                            self.setModels(response);
                            logger.debug('[Seeder] Created Models: %s, %d objects',self.blueprint.name, response.length);

                            resolve(self);

                        }, error("Error creating seeds"));
                    }
                    // User is asking to dump the database records first.
                    if (self.reset) {
                        logger.debug('[Seeder] Dumping models: %s', self.blueprint.name);
                        self.model.remove().then(create, error("Error removing seeds"));
                    } else {
                        create();
                    }
                });
            }

        }

        app.Seeder = Seeder;
    }
});