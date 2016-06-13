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
     * The supported localities.
     * @var array<string>
     */
    lang_support: ['en','en_US'],

    /**
     * Mongo database.
     * @var string
     */
    db: "mongodb://localhost/expressmvc",

    /**
     * Enable livereload.
     * @var boolean
     */
    livereload: "http://localhost:35729/livereload.js",

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
     * Files to require.
     * @var object
     */
    files: {
        models: ['user','media'],
        controllers: ['authController','indexController','restController']
    }
};