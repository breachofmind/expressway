"use strict";

var Expressway = require('expressway');
var mongoose   = require('mongoose');
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);
var Converter  = require("csvtojson").Converter;
var Promise    = require('bluebird');
var utils      = require('../support/utils');
var _          = require('lodash');

mongoose.Promise = Promise;

const CRUD = ['create','read','update','delete'];

/**
 * ORM and Database provider.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ModelProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     * @param utils Object
     */
    constructor(app)
    {
        super(app);

        this.order = 1;

        app.service(csvToJson);
        app.service(permissions);
        app.service('db', mongoose);
        app.service('ObjectId', mongoose.Types.ObjectId);
        app.service('ObjectIdType', mongoose.Schema.Types.ObjectId);
        app.service('SchemaTypes', mongoose.Schema.Types);
        app.service('seeder', app.load(require('../services/SeederService')));

        app['db'] = mongoose;
    }

    /**
     * When the app boots, connect to the database.
     * @param next Function
     * @param app Application
     * @param db Mongoose
     * @param config Function
     * @param log Winston
     * @param debug Function
     */
    boot(next,app,db,config,log,debug)
    {
        let credentials = config('db');

        if (app.providers.has('CLIProvider')) {
            app.providers.get('CLIProvider').add('seedCommand', this.seedCommand);
            app.providers.get('CLIProvider').add('listModelsCommand', this.listModelsCommand);
        }

        db.connection.on('error', (err) => {
            log.error('ModelProvider connection error: %s on %s', err.message, credentials);
            process.exit(1);
        });

        db.connection.on('open', () => {
            debug('ModelProvider connected to MongoDB: %s', credentials);
            app.emit('database.connected', db);
            next();
        });

        db.connect(credentials);

        // This should tell the Session middleware which store to use.
        app.emit('database.boot',db,MongoStore);
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