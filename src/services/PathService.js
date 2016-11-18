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
     * Get the protected paths object.
     * @returns {{}}
     */
    get paths()
    {
        return this._paths;
    }

    /**
     * Create a new path method.
     * @param pathName string
     * @param dir string|PathObject
     * @param createPath boolean
     * @returns string
     */
    set(pathName, dir, createPath=false)
    {
        var setPath = _.trimEnd(path.normalize( dir.toString() ), "/");

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
     * @returns {String}
     */
    path(pathName, uri="")
    {
        if (! this._paths[pathName]) {
            throw new Error(`Path name "${pathName}" is not set`);
        }
        return new PathString(this._paths[pathName] + "/" + uri);
    }

    /**
     * Prepend a string before a string or each item in array.
     * @param what string
     * @param to Array<String>|String
     * @returns {Array<String>|String}
     */
    prepend(what, to)
    {
        if(! Array.isArray(to)) to = [to];
        var out = to.map(obj => {
            if (! obj.isPath) obj = new PathString(obj);
            return obj.prepend(what);
        });
        return out.length == 1 ? out[0] : out;
    }
}


class PathString
{
    constructor(value) {
        this.value = value;
    }
    get isPath() {
        return true;
    }
    get basename() {
        return path.basename(this.value);
    }
    get exists() {
        return fs.existsSync(this.value);
    }
    prepend(what) {
        return new PathString(what + this.value);
    }
    extension(to) {
        if (!to) return path.extname(this.value);
        let basename = path.basename(this.value, path.extname(this.value));
        let parts = this.value.split("/");
        parts.pop();
        parts.push(basename + "." + to);
        return new PathString(parts.join("/"));
    }
    toString() {
        return this.value;
    }
    get() {
        return this.toString();
    }
}


module.exports = PathService;