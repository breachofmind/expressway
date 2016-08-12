var env = require('./env');
var system = require('../../index').Providers;

/**
 * Sample configuration file.
 * @type {{}}
 */
module.exports = {

    /**
     * Unique application key.
     * @var string
     */
    appKey: "feeef75029de8f9157928-d0715",

    /**
     * The environment name.
     * @var string local|sit|uat|prod
     */
    environment: env.environment || GLOBAL.ENV_LOCAL,

    /**
     * The webserver base URL.
     * @var string
     */
    url: env.url || "http://localhost",

    /**
     * The webserver port.
     * @var Number
     */
    port: env.port || 8081,

    /**
     * The proxy URL, if using a proxy.
     * @var string|null
     */
    proxy: env.proxy || null,

    /**
     * The directory where static content is served.
     * @var string|null
     */
    static_uri: 'public',

    /**
     * Where your views are located.
     * @var string
     */
    view_path: "app/resources/views",

    /**
     * The path your logs are stored.
     * @var string
     */
    log_path: 'logs',

    /**
     * Which view engine you are using.
     * @var string ejs|pug|hbs...
     */
    view_engine: "ejs",

    /**
     * User defined providers for your application.
     * @var array
     */
    providers: [

        // Default system providers.
        // Feel free to swap out with your own implementations.
        system.auth,
        system.cli,
        system.controller,
        system.controllerDefaults,
        system.database,
        system.express,
        system.gate,
        system.locale,
        system.logger,
        system.model,
        system.router,
        system.seeder,
        system.template,
        system.url,
        system.view,

        // Your providers here...
        function(Provider) {
            Provider.create('templateDefaults', function(){
                this.requires('templateProvider');
                return function(app) {
                    app.Template.defaults = function(template) {
                        template.style('foundation', "https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation-flex.min.css");
                    };
                }
            })
        }
    ],

    /**
     * The supported localities.
     * @var array<string>
     */
    lang_support: ['en','en_US'],

    /**
     * Mongo database.
     * @var string
     */
    db: env.db || "mongodb://localhost/expressmvc",

    /**
     * Enable livereload.
     * @var boolean
     */
    livereload: "http://localhost:35729/livereload.js",

    /**
     * Enable debug mode.
     * @var boolean
     */
    debug: env.debug || true,

    /**
     * The limit of models to return in REST api.
     * @var Number
     */
    limit: 10000,
};