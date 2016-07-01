var Application = require('../application');

var rootPath = Application.rootPath;

/**
 * A helper class for use with gulp scripts.
 */
module.exports = function(gulp, paths)
{

    return {
        /**
         * Return a complete path to the path name.
         * @param name string
         * @param path string|undefined
         * @returns {string}
         */
        pathTo: function(name, path)
        {
            return paths[name] + "/" + (path || null);
        },

        /**
         * Provide an array to a path name, and prepend the path to each file.
         * @param name string
         * @param pathArray array
         * @returns {*|Object|Array}
         */
        pathsTo: function(name, pathArray)
        {
            var self = this;
            return pathArray.map(function(path)
            {
                return self.pathTo(name,path);
            })
        }
    }
};