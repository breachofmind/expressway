var env = require('./env');

/**
 * Main configuration file for the application.
 * @param system object
 */
module.exports = function(system)
{
    return {
        /**
         * The global environment setting.
         * @type string ENV_LOCAL|ENV_DEV|ENV_PROD|ENV_CLI|ENV_TEST
         */
        environment: env.environment || ENV_LOCAL,

        /**
         * The unique application key.
         * @type string
         */
        appKey: "",

        /**
         * Debug setting.
         * @type boolean
         */
        debug: env.debug || true,

        /**
         * The database credentials.
         * @type string
         */
        db: env.db || "mongodb://localhost/expressmvc",

        /**
         * The server url.
         * @type string
         */
        url: env.url || "http://localhost",

        /**
         * The server port.
         * @type number
         */
        port: env.port | 8081,

        /**
         * The server proxy url, if using a proxy.
         * @type string|null
         */
        proxy: env.proxy || null,

        /**
         * Limit of records to return in the API.
         * @type number
         */
        limit: 10000,

        /**
         * View engine used by Express.
         * @type string ejs|pug|jade|hbs...
         */
        view_engine: "ejs",

        /**
         * Supported languages.
         * @type array<string>
         */
        lang_support: ['en','en_US'],

        /**
         * Folders relative to the application path.
         * @type string
         */
        resources_path:   "resources",
        views_path:       "resources/views",
        controllers_path: "controllers",
        models_path:      "models",
        providers_path:   "providers",
        locales_path:     "resources/lang",
        static_path:      "public",
        logs_path:        "logs",

        /**
         * The application provider array.
         * @type array
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
            system.gulp,
            system.locale,
            system.logger,
            system.model,
            system.router,
            system.seeder,
            system.template,
            system.url,
            system.view,

            // Your providers here...
            require('../providers/templateDefaults')
        ]
    }
};