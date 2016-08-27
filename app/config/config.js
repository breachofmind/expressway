var env = require('./env');

module.exports = function(system)
{
    return {
        // The environment
        environment: env.environment || ENV_LOCAL,
        appKey:      "",
        debug:       env.debug || true,
        db:          env.db || "mongodb://localhost/expressmvc",
        url:         env.url || "http://localhost",
        port:        env.port | 8081,
        proxy:       env.proxy || null,
        limit:       10000,
        view_engine: "ejs",
        lang_support: ['en','en_US'],

        resources_path:   "resources",
        views_path:       "resources/views",
        controllers_path: "controllers",
        models_path:      "models",
        providers_path:   "providers",
        locales_path:     "resources/lang",
        static_path:      "public",
        logs_path:        "logs",

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