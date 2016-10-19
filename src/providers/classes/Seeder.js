"use strict";

var Expressway      = require('expressway');
var app             = Expressway.instance.app;
var Converter       = require("csvtojson").Converter;
var Promise         = require('bluebird');
var fs              = require('fs');
var ModelProvider   = app.get('ModelProvider');
var log             = app.get('log');
var colors          = require('colors/safe');
var columnify       = require('columnify');
var path            = app.get('path');


var msg = {
    running: `Running Seeder: ${colors.green("%s")}`,
    seeding: `Seeding: ${colors.green("%s")}`,
    parsed:  `Parsed Seed: ${colors.green("%s")} (${colors.blue("%s")} rows)`,
    prepare: `Preparing Seed: ${colors.green("%s")}`,
    created: `Created Models: ${colors.green("%s")} in table ${colors.green("%s")}, ${colors.blue("%s")} objects`,
    dumping: `Dumping models: ${colors.green("%s")}`,
    err_noModel:  `Error seeding, no model or data: ${colors.red("%s")}`,
    err_creating: `Error creating models: ${colors.red("%s")}`,
    err_dumping:  `Error dumping models: ${colors.red("%s")}`
};

var seeders = [];

/**
 * The main seeder class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Seeder
{
    constructor(name, seedDir)
    {
        this.cliOptions = app.get('cliOptions');
        this.name = name;
        this.path = seedDir || path.db('seeds/');

        /**
         * Dump the database table before seeding?
         * @type {boolean}
         */
        this.dump = this.cliOptions.dump || false;

        /**
         * Allows the seeder to be seeded.
         * It can still be prepared, however.
         * @type {boolean}
         */
        this.active = true;

        // Allow the user to disable this seeder
        // from the command line utility.
        if (this.cliOptions.seeder && this.cliOptions.seeder !== this.name) {
            this.active = false;
        }

        this.seeds = [];

        // For global queueing.
        seeders.push(this);
    }

    /**
     * Gets the ID of a row.
     * This is the default method.
     * @returns {number}
     */
    static getId()
    {
        Seeder.counter ++;
        return Seeder.counter;
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

    /**
     * Exit the seeding process.
     * @returns void
     */
    static done()
    {
        log.info('Done seeding.');
        process.exit();
    }

    /**
     * Prepare all declared seeders.
     * @returns {Promise.<*>}
     */
    static prepareAll(done)
    {
        return Promise.all( seeders.map(seeder => { return seeder.prepare(); })).then(result => {
            return done(result);
        }).catch(err => {
            log.warn("Error post-processing seeds. Reason: "+err.message);
        });
    }

    /**
     * Seed all declared seeders, given they are active.
     * @returns {Promise.<TResult>}
     */
    static seedAll()
    {
        return Promise.all( seeders.map(seeder => { return seeder.seed(); }) ).then(Seeder.done);
    }
}

Seeder.counter = 0;

/**
 * A little seed that will grow into a beautify tree of data.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Seed
{
    constructor(model,source,seeder)
    {
        this.model  = model;
        this.Model  = ModelProvider.get(this.model);
        this.source = source;
        this.seeder = seeder;
        this.parsed = false;
        this.seeded = false;
        this.data   = [];
        this.models = [];
        this.dump  = seeder.dump ? true : false;
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
            array[i].id = Seeder.getId();
            array[i] = this.parse(array[i], i);
        }

        // Reset the counter for
        // the next bunch of seeds.
        Seeder.counter = 0;

        this.data = this.seeder[this.model] = array;

        this.parsed = true;

        log.info(msg.parsed, this.model, array.length);

        if (this.seeder.cliOptions.list) {
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

        if (seed.parsed || seed.seeder.active === false) return seed;

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
        if (! this.Model || ! this.data.length)
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

module.exports = Seeder;