"use strict";

var Application = require('../application');
var Model = require('../model');
var path = require('path');
var EventEmitter = require('events');
var Converter = require("csvtojson").Converter;

var app,db,ObjectId,logger;

class Seeder
{
    static boot(factory)
    {
        if (!app) {
            app = Application.create();
            logger = app.logger;
            db = app.db;
            ObjectId = db.Types.ObjectId;
        }
    }
    /**
     * Constructor.
     * @param name string of Seeder type
     */
    constructor(name)
    {
        Seeder.boot(this);

        this.name = name;
        this.queue = 0;
        this.count = 0;
        this.seedPath = Application.rootPath('db/seeds');

        this._seeds = {};
        this._events = new EventEmitter();

        this.on('finished', function(){
            logger.info('Finished seeding.');
            process.exit();
        })
    }

    /**
     * Attach an event listener.
     * @param event string
     * @param callback function
     * @returns {*}
     */
    on(event,callback)
    {
        return this._events.on(event,callback);
    }

    /**
     * Emit an event.
     * @param event string
     * @param args mixed
     */
    emit(event,args)
    {
        return this._events.emit(event,args);
    }

    /**
     * Add a new seed.
     * @param name string
     * @param file string
     * @param parse function, optional
     * @returns {Seeder}
     */
    add(name, file, parse)
    {
        this.queue ++;
        this.count ++;
        this._seeds[name] = new Seed(this, name, file, parse);
        return this;
    }

    /**
     * Create models out of the seeds.
     * @param callback function when done
     */
    createModels(callback)
    {
        logger.info('Creating models...');

        var queue = this.count;

        var done = function(seed,objects)
        {
            queue--;
            this.emit(`done_${seed.name}`,objects);

            if (queue > 0) return;

            if (callback) callback();

            this.emit('finished');

        }.bind(this);



        for (let name in this._seeds)
        {
            this._seeds[name].make(true, function(seed,objects) {
                done(seed,objects);
            })
        }
    }

    /**
     * Begin the seeding process.
     * @returns void
     */
    seed()
    {
        for (let name in this._seeds)
        {
            this._seeds[name].seed();
        }
    }

    /**
     * Call when done with parsing the CSV files.
     * @returns void
     */
    done()
    {
        this.queue --;
        if (this.queue > 0) {
            return;
        }
        this.emit('done',this._seeds);
    }
}


/**
 * An individual seed.
 */
class Seed
{
    /**
     * Constructor
     * @param seeder Seeder
     * @param name string
     * @param file string
     * @param parse function, optional
     */
    constructor(seeder,name,file,parse)
    {
        this.seeder = seeder;
        this.name   = name;
        this.file   = file;
        this.path   = seeder.seedPath+file;
        this.csv    = [];
        this.model  = null;
        this.done   = false;

        this.model = Model.get(name) ? Model.get(name).model : null;

        this.converter = new Converter({});

        this.parse = parse || function(row,i) {
                return row;
            };
    }

    /**
     * Call when done parsing the CSV.
     * @param results array|null
     */
    isDone(results)
    {
        this.csv = results;
        this.done = true;
        this.seeder.emit(`csv_${this.name}`, this);
        this.seeder.done();
    }

    /**
     * Begin the seeding process.
     * @returns {*}
     */
    seed()
    {
        logger.info(`Seeding ${this.path} -> ${this.name}`);

        if (! this.file) {
            return this.isDone([]);
        }
        this.converter.fromFile(this.path, function(err,results) {
            if (err) {
                logger.error(`Error with file: ${this.file}`);
                this.isDone([]);
                return;
            }

            for (let i=0; i<results.length; i++)
            {
                results[i]._id = new ObjectId();
                results[i] = this.parse(results[i], i);
            }

            this.isDone(results);

        }.bind(this));
    }

    /**
     * Make models out of these seeds.
     * @param reset
     * @param done
     * @returns {*}
     */
    make(reset,done)
    {
        var self = this;

        if (! this.model || ! this.csv.length) {
            logger.warn (`No model "${this.name}" or empty CSV, skipping...`);
            return done(this,null);
        }

        var create = function()
        {
            return self.model.create(self.csv).then(function(response) {
                return done(self,response);
            }, function(err) {
                logger.error(`Error creating models "${self.name}", ${err.name} - ${err.message}`);
                console.log(self.csv);
                return done(self,err);
            })
        };

        if (reset) {
            return this.model.remove().then(function(){
                return create();
            }, function(err) {
                logger.error(`Error creating models "${self.name}" after reset, ${err.name} - ${err.message}`);
                return done(self,err);
            });
        } else {
            return create();
        }
    }
}

module.exports = Seeder;