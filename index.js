/**
 * The Express MVC application.
 * @type {{}}
 */
module.exports = {
    Application: require('./src/application'),
    Auth: require('./src/auth'),
    Seeder: require('./src/support/seeder'),
    Model: require('./src/model'),
    Controller: require('./src/controller'),
    Paginator: require('./src/support/paginator'),
    utils: require('./src/support/utils')
};

