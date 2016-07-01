/**
 * The Express MVC application.
 * @type {{}}
 */
module.exports = {
    Application: require('./src/application'),
    Auth:        require('./src/auth'),
    Seeder:      require('./src/support/seeder'),
    Model:       require('./src/model'),
    Template:    require('./src/template'),
    Controller:  require('./src/controller'),
    CLI:         require('./src/cli'),
    utils:       require('./src/support/utils'),
    gulpUtil:    require('./src/support/gulp'),

    init: function(rootPath)
    {
        this.Application.root = rootPath;

        return this.Application.create().bootstrap();
    },

    /**
     * Return the application instance if it exists.
     * @returns {Application|null}
     */
    app: function()
    {
        return require('./src/application').instance;
    }
};