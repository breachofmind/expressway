var Application = require('../application');

var rootPath = Application.rootPath;

/**
 * A helper class for use with gulp scripts.
 */
module.exports = function(gulp, paths)
{

    return {
        pathTo: function(name, path)
        {
            return paths[name] + "/" + path;
        },

        buildPath: gulp.dest(paths['build'])
    }
};