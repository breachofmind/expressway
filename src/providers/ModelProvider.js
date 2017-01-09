"use strict";

var expressway = require('expressway');
var Converter  = require("csvtojson").Converter;
var Promise    = require('bluebird');
var utils      = require('../support/utils');
var _          = require('lodash');

const CRUD = ['create','read','update','delete'];

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.order = 1;

        app.service(csvToJson);
        app.service(permissions);
        app.service('db', app.load(require('../drivers/MongooseDriver')));
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
        app.call(this,'seedCommand');
        app.call(this,'listModelsCommand');

        db.connect().then(next, process.exit);
    }


    /**
     * Run the seeder.
     * @usage ./bin/cli seed
     */
    seedCommand(app,cli,log,seeder)
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
    }

    /**
     * List available models.
     * @usage ./bin/cli models
     */
    listModelsCommand(app,cli)
    {
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
                        guards: model.guarded
                    }
                },
                colors: {
                    order: ITEM_ORDER_COLOR,
                    name: ITEM_TITLE_COLOR,
                    title: 'gray',
                    expose: CONSOLE_BOOLEAN
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