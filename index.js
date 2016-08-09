var Application = require('./src/application');

/**
 * The Express MVC application.
 * @type {{}}
 */
module.exports = function(rootPath)
{
    Application.root = rootPath;

    return Application.create().bootstrap();
};