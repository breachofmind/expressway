"use strict";

var expressway = require('expressway');
var Promise    = require('bluebird');
var path       = require('path');
var fs         = require('fs');
var _          = require('lodash');
var colors     = require('colors/safe');
var columnify  = require('columnify');
var EventEmitter = require('events');
var ObjectCollection = require('../ObjectCollection');

const MESSAGES = {
    "dumping" : "error dumping models: %s",
    "creating" : "error creating models: %s",
    "seeding" : "error seeding: %s",
};

module.exports = function(app,debug,log,ObjectId,paths,csvToJson)
{
    class SeederService extends ObjectCollection
    {
        constructor()
        {
            super(app,'seeder');

            this.class = Seeder;
        }

        /**
         * Add a new seeder instance.
         * @param name string
         * @param opts object
         * @returns {Seeder}
         */
        add(name,opts={})
        {
            super.add(name, new Seeder(name,opts));

            return this.get(name);
        }

        /**
         * Run the seeder.
         * @param opts object - could be from CLI
         * @returns {Promise}
         */
        run(opts={})
        {
            return new Promise((resolve,reject) =>
            {
                let preparing = this.each(seeder => {
                    seeder.set(opts);
                    return seeder.prepare();
                });

                Promise.all(preparing).then(result => {
                    this.emit('parsed',result);
                    let seeding = this.each(seeder => {
                        return seeder.seed();
                    });
                    Promise.all(seeding).then(result => {
                        this.emit('seeded',result);
                        return resolve(result);
                    });
                });
            })

        }
    }

    /**
     * A seeder instance.
     */
    class Seeder extends EventEmitter
    {
        constructor(name,opts={})
        {
            super();

            this.name = name;
            this.path = paths.db('seeds');
            this.dump = false;
            this.list = false;
            this.active = true;
            this.parse = null;
            this.seeds = [];

            this.set(opts);
        }

        /**
         * Set options for this seeder.
         * @param opts object
         * @returns {Seeder}
         */
        set(opts={})
        {
            if (opts.parsed) this.once('parsed', opts.parsed);
            ['active','list','dump','parse','path'].forEach(key => {
                if (opts.hasOwnProperty(key)) this[key] = opts[key];
            });
            return this;
        }

        /**
         * Get a new object id.
         * @returns {ObjectId}
         */
        getId()
        {
            return new ObjectId;
        }

        /**
         * Add a new seed.
         * @param model string
         * @param source string|array
         * @returns {Seed}
         */
        add(model,source)
        {
            if (! source) {
                throw new TypeError('source should be array of objects or path to seed file');
            } else if (typeof source == 'string') {
                source = path.resolve(this.path,source);
            }
            let seed = new Seed(model,source,this);
            this.seeds.push(seed);

            return seed;
        }

        /**
         * Prepare all seeds.
         * @returns {Promise.<*>}
         */
        prepare()
        {
            log.info('preparing seeder: %s', this.name);
            let promises = this.seeds.map(seed => { return seed.prepare() });
            return Promise.all(promises).then(done => {
                this.emit('parsed', this.toJSON(), this);
            });
        }

        /**
         * Seed all seeds.
         * @returns {Promise.<*>}
         */
        seed()
        {
            log.info('seeding seeder: %s', this.name);
            let promises = this.seeds.map(seed => { return seed.seed() });
            return Promise.all(promises);
        }

        /**
         * Get an object with all seed data attached.
         * @returns {{}}
         */
        toJSON()
        {
            let out = {};
            this.seeds.forEach(seed => {
                out[seed.name] = seed.data;
            });
            return out;
        }
    }

    /**
     * A little seed that will grow into a beautify tree of data.
     * @author Mike Adamczyk <mike@bom.us>
     */
    class Seed extends EventEmitter
    {
        constructor(model,source,seeder)
        {
            super();

            this.name = model;
            this.model = app.models.has(model) ? app.models.get(model) : null;
            this.seeder = seeder;
            this.source = source;

            this.parsed = false;
            this.seeded = false;

            this._data = [];
            this._models = [];

            // Add an 'id' field if the model has a primary key.
            if (this.model && this.model.primaryKey) {
                this.on('parse', (row,i,arr) => {
                    row[this.model.primaryKey] = this.seeder.getId();
                })
            }
            // If parser was passed in the options, use that.
            if (this.seeder.parse) {
                this.on('parse', this.seeder.parse);
            }
            // Show a list of data after it's parsed.
            this.once('parsed', arr => {
                if (this.seeder.list) {
                    console.log(columnify(arr));
                }
            })
        }

        /**
         * Get the data array.
         * @returns {Array}
         */
        get data() {
            return this._data;
        }

        /**
         * Get the created models collection.
         * @returns {Array}
         */
        get models() {
            return this._models;
        }

        /**
         * Set the data array.
         * @param array {Array}
         */
        set data(array)
        {
            if (! Array.isArray(array)) {
                this._data = [];
                return;
            }
            array.forEach((row,index) => {
                this.emit('parse', row,index,array);
            });

            this._data = array;

            success('parsed seed: %s -> %s', this.name, array.length);

            this.emit('parsed', this._data);
        }

        /**
         * Prepare the seeds for seeding.
         * @returns {Promise.<Seed>}
         */
        prepare()
        {
            log.info('preparing seed: %s', this.name);
            if (this.parsed) {
                return Promise.resolve(this);
            } else if (Array.isArray(this.source)) {
                this.data = this.source;
                this.parsed = true;
                return Promise.resolve(this);
            }

            return new Promise((resolve,reject) =>
            {
                log.info('parsing seed: %s -> %s', this.source, this.name);
                csvToJson(this.source).then(array => {
                    this.data = array;
                    this.parsed = true;
                    resolve(this);
                }).catch(err => {
                    reject(err);
                });
            })
        }

        /**
         * Check if this seed can run.
         * @returns {boolean}
         */
        get canSeed()
        {
            return this.seeder.active
                && ! this.seeded
                && this.model;
        }

        /**
         * Seed the database.
         * @returns {Promise}
         */
        seed()
        {
            if (! this.canSeed) {
                log.warn('skipped seeding seed: %s', this.name);
                return Promise.resolve(this);
            }

            return new Promise((resolve,reject) =>
            {
                log.info('seeding seed: %s', this.name);

                this.dump().then(result => {
                    this.create().then(result => {
                        log.info('seeded seed: %s', this.name);
                        this.emit('seeded',this);
                        resolve(this);
                    })
                }).catch(this._onError('seeding',resolve,reject));
            });
        }

        /**
         * Create new models.
         * @returns {Promise}
         */
        create()
        {
            if (! this.data.length) return Promise.resolve(this);

            return new Promise((resolve,reject) =>
            {
                this.model
                    .create(this.data)
                    .then(response => {
                        this.seeded = true;
                        this._models = response;
                        success('created models for seed: %s -> %s records', this.name, response.length);
                        this.emit('created', this, response);
                        resolve(this);
                    }, this._onError('creating',resolve,reject));
            });
        }

        /**
         * Dump the models from the database.
         * @returns {Promise.<Seed>}
         */
        dump()
        {
            if (! this.seeder.dump && this.canSeed) return Promise.resolve(this);

            return new Promise((resolve,reject) =>
            {
                this.model
                    .delete()
                    .then(response => {
                        success('dumped seed: %s', this.name);
                        this.emit('dumped', this,response);
                        resolve(this);
                    }, this._onError('dumping',resolve,reject))
            });
        }

        /**
         * Seeding error handler.
         * @param key string message key
         * @param resolve function
         * @param reject function
         * @returns {*}
         * @private
         */
        _onError(key,resolve,reject)
        {
            let seed = this;
            return function(err)
            {
                let message = MESSAGES[key];

                error(message,seed.name);
                console.error(err.message || "");

                return resolve ? resolve(seed) : null;
            }
        }
    }

    /**
     * Color the arguments based on type.
     * @param args array
     * @returns {array}
     */
    function colorArgs(args)
    {
        args.forEach((arg,i) => {
            let color = isNaN(arg) ? 'green' : 'blue';
            args[i] = colors[color](arg);
        });
        return args;
    }

    /**
     * A success message.
     * @param message string
     * @param args
     */
    function success(message,...args)
    {
        args = colorArgs(args);
        log.info(colors.green('success! ') + message, ...args);
    }

    /**
     * An error message.
     * @param message string
     * @param args
     */
    function error(message,...args)
    {
        args = colorArgs(args);
        log.error(colors.red('error! ') + message, ...args);
    }

    return new SeederService;
};