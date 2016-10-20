"use strict";

var _ = require('lodash/string');
var path = require('path');
var fs = require('fs');

/**
 * Helper service for creating paths to files in the application.
 */
class PathService
{
    constructor()
    {
        this._paths = {};
    }

    /**
     * Create a new path method.
     * @param pathName string
     * @param dir string
     * @param createPath boolean
     * @returns string
     */
    set(pathName, dir, createPath=false)
    {
        var setPath = _.trimEnd(path.normalize( dir ), "/");

        // Create the path if it doesn't exist.
        if (createPath && ! fs.existsSync(setPath)) fs.mkdirSync(setPath);

        this._paths[pathName] = setPath;

        this[pathName] = (uri) => {
            return this.path(pathName, uri);
        };

        return setPath;
    }

    /**
     * Create a path to the given uri.
     * @param pathName string
     * @param uri string
     * @returns {string}
     */
    path(pathName, uri="")
    {
        if (! this._paths[pathName]) {
            throw new Error(`Path name "${pathName}" is not set`);
        }
        return this._paths[pathName] + "/" + uri;
    }
}

module.exports = PathService;