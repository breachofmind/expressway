"use strict";

var Provider  = require('expressway').Provider;
var Converter = require("csvtojson").Converter;
var Promise   = require('bluebird');
var utils     = require('../support/utils');
var _         = require('lodash');

const CRUD = ['create','read','update','delete'];

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Provider
{
    /**
     * Constructor.
     * @param app {Application}
     * @param config {Function}
     */
    constructor(app,config)
    {
        super(app);

        this.order = 1;

        let driver = config('db.driver', require('../drivers/MongooseDriver'));

        app.service(csvToJson);
        app.service(permissions);
        app.service('db', app.load(driver));
        app.service('seeder', app.load(require('../services/SeederService')));
    }

    /**
     * When the app boots, connect to the database.
     * @param next Function
     * @param app Application
     * @param db Driver
     */
    boot(next,app,db)
    {
        app.call(this,'commands');

        db.connect().then(next, process.exit);
    }


    /**
     * Add some command line options.
     * @param app {Application}
     * @param cli {CLI}
     * @param log {Winston}
     * @param seeder {SeederService}
     */
    commands(app,cli,log,seeder)
    {
        cli.command('seed [options]', "Seed the database with data")
            .option('-s, --seeder [name]', "Run only the given seeder name")
            .option('-d, --dump', "Dump all models before seeding")
            .option('-l, --list', "List the parsed data array in a column view")
            .option('-p, --parseonly', "Run the parser but do not seed the database")
            .action((env,opts) =>
            {
                if (app.env == ENV_PROD) {
                    log.error("Seeding not allowed in production mode! Exiting");
                    return process.exit(1);
                }

                let start = Date.now();
                seeder.run(opts).then(function(result) {
                    let end = Date.now();
                    let elasped = ((end - start) / 1000).toFixed(3);
                    log.info('done seeding in %s sec',elasped);
                    process.exit();
                });
            });


        cli.command('models', "List all models").action((env,opts) =>
        {
            var columns = cli.columns(app.models.list(), {
                title: "Models list",
                map(item, index) {
                    var model = item.object;
                    return {
                        order: item.index,
                        name: model.name,
                        slug: model.slug,
                        title: model.title,
                        expose: model.expose,
                        guards: model.fields.names(field => { return field.guarded }),
                        unique: model.fields.names(field => { return field.unique }),
                    }
                },
                colors: {
                    order: cli.Console.Index,
                    name: cli.Console.Name,
                    title: cli.Console.Secondary,
                    expose: cli.Console.Boolean
                }
            });

            cli.output([columns], true);
        })
    }
}

/**
 * Convert a CSV file to a data array.
 * @param file string
 * @param opts object
 * @returns {Promise}
 */
function csvToJson(file,opts={})
{
    return new Promise((resolve,reject) =>
    {
        let converter = new Converter(opts);

        converter.fromFile(file, function(err,results)
        {
            if (err) return reject(err,file);

            return resolve(results);
        })
    })
}

/**
 * A helper function for creating permissions.
 * @param modelNames {String|Array}
 * @param actions {Array} - defaults to [create,read,update,delete]
 * @returns {Array}
 */
function permissions(modelNames, actions=CRUD)
{
    let models = [].concat(modelNames);
    return utils.compound (models.map(modelName => {
        return actions.map(action => {
            return `${modelName}.${action}`;
        })
    }));
}

permissions.CRUD = CRUD;

module.exports = ModelProvider;