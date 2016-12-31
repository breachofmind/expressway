"use strict";

var expressway = require('expressway');
var Converter  = require("csvtojson").Converter;
var Promise    = require('bluebird');
var fs         = require('fs');
var colors     = require('colors/safe');
var columnify  = require('columnify');

var msg = {
    running: `Running Seeder: ${colors.green("%s")}`,
    seeding: `Seeding: ${colors.green("%s")}`,
    parsed:  `Parsed Seed: ${colors.green("%s")} (${colors.blue("%s")} rows)`,
    prepare: `Preparing Seed: ${colors.green("%s")}`,
    created: `Created Models: ${colors.green("%s")} in table ${colors.green("%s")}, ${colors.blue("%s")} objects`,
    dumping: `Dumping models: ${colors.green("%s")}`,
    err_noModel:  `Error seeding, no model: ${colors.red("%s")}`,
    err_creating: `Error creating models: ${colors.red("%s")}`,
    err_dumping:  `Error dumping models: ${colors.red("%s")}`
};

module.exports = function(app,debug,log,ObjectId,paths)
{
    /**
     * The main seeder class.
     * @author Mike Adamczyk <mike@bom.us>
     */
    class Seeder
    {
        constructor(name, opts={}, factory)
        {
            this.name = name;
            this.path = opts.seedDir || paths.db('seeds/');
            this.opts = opts;
            this.factory = factory;

            /**
             * Dump the database table before seeding?
             * @type {boolean}
             */
            this.dump = this.opts.dump || false;

            /**
             * Allows the seeder to be seeded.
             * It can still be prepared, however.
             * @type {boolean}
             */
            this.active = true;

            // Allow the user to disable this seeder
            // from the command line utility.
            if ((this.opts.seeder && this.opts.seeder !== this.name) || this.opts.parseonly)
                this.active = false;

            /**
             * Seeds in this object.
             * @type {Array<Seed>}
             */
            this.seeds = [];
        }

        /**
         * Gets the ID of a row.
         * This is the default method.
         * @returns {number}
         */
        static getId()
        {
            return new ObjectId();
            // Seeder.counter ++;
            // return Seeder.counter;
        }

        /**
         * Add a new seed.
         * @param model string model name
         * @param source array|string filename
         * @param parse function, optional
         * @returns {Seed}
         */
        add(model, source, parse)
        {
            var seed = new Seed(model, source, this);

            if (typeof parse === 'function') {
                seed.parse = parse;
            }
            this.seeds.push(seed);
            return seed;
        }

        /**
         * Parse the seeds.
         * @returns Promise
         */
        prepare()
        {
            log.info(msg.running, this.name);
            var promises = this.seeds.map(seed => { return seed.prepare() });
            return Promise.all(promises).catch(err => {
                log.error(err.message);
            });
        }

        /**
         * Seed the database.
         * @returns Promise
         */
        seed()
        {
            if (this.active) log.info(msg.seeding, this.name);
            var promises = this.seeds.map(seed => { return seed.seed() });
            return Promise.all(promises).catch(err => {
                log.error(err);
            });
        }
    }

    /**
     * A little seed that will grow into a beautify tree of data.
     * @author Mike Adamczyk <mike@bom.us>
     */
    class Seed
    {
        constructor(model,source,seeder)
        {
            this.model  = model;
            this.Model  = app.models.get(this.model);
            this.source = source;
            this.seeder = seeder;
            this.parsed = false;
            this.seeded = false;
            this.data   = [];
            this.models = [];
            this.dump  = seeder.dump;
        }

        setId(row)
        {
            var primaryKey = this.Model.primaryKey;
            if (! row.hasOwnProperty(primaryKey)) {
                row[primaryKey] = Seeder.getId();
            }
            return row;
        }

        /**
         * Set the parsed data array.
         * The data array can be created into models.
         * @param array {Array}
         * @returns {*}
         */
        setData(array)
        {
            for (let i=0; i<array.length; i++)
            {
                array[i] = this.setId(array[i]);
                array[i] = this.parse(array[i], i);
            }

            // Reset the counter for
            // the next bunch of seeds.
            Seeder.counter = 0;

            this.data = this.seeder[this.model] = array;

            this.parsed = true;

            log.info(msg.parsed, this.model, array.length);

            if (this.seeder.opts.list) {
                console.log(columnify(array) + "\n");
            }

            return array;
        }

        /**
         * Prepare this seed to be parsed.
         * @returns {Seed}
         */
        prepare()
        {
            var seed = this;

            if (seed.parsed) return seed;

            if (Array.isArray(seed.source)) {
                this.setData(seed.source);
                return seed;
            }

            var file = seed.seeder.path + seed.source;

            return new Promise((resolve,reject) =>
            {
                var converter = new Converter({});

                var converted = (err,results) =>
                {
                    if (err || ! results.length) return reject(err,seed);

                    this.setData(results);

                    return resolve(seed);
                };

                converter.fromFile(file, converted);
            });
        }

        /**
         * Inspect this seed to see if seeding is possible.
         * @returns {boolean}
         */
        check()
        {
            if (this.seeder.active === false) {
                return false;
            }
            if (! this.model)
            {
                log.warn(msg.err_noModel, this.model);
                return false;
            }

            return ! this.seeded;
        }

        /**
         * Seed the database.
         * @returns {Promise|null}
         */
        seed()
        {
            var seed = this;

            if (seed.check() === false) return null;

            return new Promise((resolve,reject) =>
            {
                if (this.dump) {
                    log.info(msg.dumping, seed.model);
                    return seed.Model.remove().then(response => {
                        if (! seed.data.length) return resolve(seed);
                        return seed.create(resolve).then(models => {
                            resolve(seed);
                        });
                    }).error(seed.error(msg.err_dumping, resolve));

                } else {
                    return seed.create(resolve).then(models => {
                        resolve(seed);
                    })
                }
            });
        }

        /**
         * Create models from the data array.
         * @param done {Function}
         * @returns {Promise}
         */
        create(done)
        {
            var seed = this;

            return seed.Model.create(seed.data)
                .catch(seed.error(msg.err_creating, done))
                .then( response =>
                {
                    seed.seeded = true;
                    seed.models = response;

                    log.info(msg.created, seed.model, seed.Model.table, response.length);

                    return response;
                });
        }

        /**
         * Default error handling.
         * @param message {string}
         * @param done {Function}
         * @returns {function(this:Seed)}
         */
        error(message, done)
        {
            return function(err) {
                console.error(err);
                log.error(message, this.model);
                done(this);
            }.bind(this);
        }

        /**
         * The default parsing method.
         * @param row object
         * @returns {object}
         */
        parse(row)
        {
            return row;
        }
    }

    /**
     * Return the seeder service.
     */
    return new class SeederService
    {
        constructor()
        {
            this.seeders = [];
            this.counter = 0;
            this.opts = {};
        }

        /**
         * Get the name of the class.
         * @returns {String}
         */
        get name()
        {
            return this.constructor.name;
        }

        /**
         * Add a new seeder.
         * @param name String
         * @param opts Object
         * @returns {Seeder}
         */
        add(name,opts=this.opts)
        {
            if (this.has(name)) {
                throw new Error('seeder already exists: '+name)
            }
            let seeder = new Seeder(name,opts,this);
            this.seeders.push(seeder);
            this[name] = seeder;

            return seeder;
        }

        /**
         * Check if a seeder exists.
         * @param name string
         * @returns {boolean}
         */
        has(name)
        {
            return this.seeders.indexOf(name) > -1;
        }

        /**
         * Prepare all seeders.
         * @param done Function
         * @returns {Promise|*|Promise.<T>}
         */
        prepare(done)
        {
            if (! done) done = function(result) {};

            return Promise.all( this.seeders.map(seeder => { return seeder.prepare(); })).then(result => {
                return done(result);
            }).catch(err => {
                log.warn("error post-processing seeds: %s", err.message);
            });
        }

        /**
         * Seed all seeders.
         * @returns {*}
         */
        seed(done=this.done)
        {
            return Promise.all( this.seeders.map(seeder => { return seeder.seed(); }) ).then(done);
        }

        /**
         * Default done method.
         * @returns void
         */
        done()
        {
            log.info('done seeding');
            process.exit();
        }
    };
};