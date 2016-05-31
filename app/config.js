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
    environment: "local",

    /**
     * The webserver base URL.
     * @var string
     */
    url: "http://localhost",

    /**
     * The directory where static content is served.
     * @var string|null
     */
    static_uri: 'public',

    /**
     * The webserver port.
     * @var Number
     */
    port: 8081,

    /**
     * Mongo database.
     * @var string
     */
    db: "mongodb://localhost/App",

    /**
     * Enable livereload.
     * @var boolean
     */
    livereload: true,

    /**
     * Enable debug mode.
     * @var boolean
     */
    debug: true,

    /**
     * The limit of models to return in REST api.
     * @var Number
     */
    limit: 10,

    /**
     * Default template configuration.
     * @param template
     */
    template: function(template)
    {

    },

    /**
     * Files to require.
     * @var object
     */
    files: {
        models: ['user','media'],
        controllers: ['authController','indexController','restController']
    }
};