"use strict";

var _ = require('lodash');
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
        this._objects = {};
    }

    /**
     * Get the protected paths object.
     * @returns {{}}
     */
    get all()
    {
        return this._paths;
    }

    /**
     * Return the objects functions.
     * @returns {{}}
     */
    get obj()
    {
        return this._objects;
    }

    /**
     * Get the stat object, if the file exists.
     * @returns Object
     */
    get stats()
    {
        return fs.statSync(this._string);
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
        let setPath = _.trimEnd(path.normalize( dir.toString() ), "/");

        // Create the path if it doesn't exist.
        if (createPath && ! fs.existsSync(setPath)) fs.mkdirSync(setPath);

        this._paths[pathName] = setPath;

        // Create a accessor function that returns a string.
        this[pathName] = (uri) => {
            return this.to(pathName, uri);
        };
        // Create an accessor that returns a PathObject.
        // IE: paths.object.root("uri");
        this._objects[pathName] = (uri) => {
            return this.object(pathName, uri);
        };

        return setPath;
    }

    /**
     * Create a path to the given uri.
     * @param pathName string
     * @param uri {String|Array}
     * @returns {String}
     */
    to(pathName, uri="")
    {
        let str = this._paths[pathName];

        if (! str) {
            throw new Error(`Path name "${pathName}" is not set`);
        }
        if (Array.isArray(uri)) uri = uri.join("/");

        return `${str}/${uri}`;
    }

    /**
     * Return an object that can help build a path.
     * @param pathName string
     * @param uri string|array
     * @returns {PathObject}
     */
    object(pathName,uri="")
    {
        return new PathObject(this.to(pathName,uri));
    }

    /**
     * Check if the path exists.
     * @param pathName string
     * @param uri string|array
     * @returns {Boolean}
     */
    exists(pathName, uri="")
    {
        return fs.existsSync(this.to(pathName,uri));
    }

    /**
     * Write contents to this file.
     * @param str String
     * @returns Void
     */
    write(str)
    {
        fs.writeFileSync(this._string, str);
    }

    /**
     * Prepend a string before a string or each item in array.
     * @param pathName String
     * @param to Array<String>|String
     * @returns {Array<String>|String}
     */
    prepend(pathName, to)
    {
        if(! Array.isArray(to)) to = [to];
        var out = to.map(obj => {
            if (obj instanceof PathObject) {
                return obj.prepend(this.to(pathName));
            }
            return this.to(pathName) + to;
        });
        return out.length == 1 ? out[0] : out;
    }
}


/**
 * A path building class.
 * @constructor
 */
class PathObject
{
    constructor(string)
    {
        this._string = string;
    }

    /**
     * Check if this path or file exists.
     * @returns {Boolean}
     */
    get exists()
    {
        return fs.existsSync(this._string);
    }

    /**
     * Get the basename.
     * @returns {String}
     */
    get basename()
    {
        return path.basename(this._string)
    }

    /**
     * Return all segments of the path.
     * @returns {Array}
     */
    get segments()
    {
        return _.compact(this._string.split("/"));
    }

    /**
     * Return a segment of the path.
     * @param index Number
     * @returns {Array|String}
     */
    segment(index)
    {
        if (! arguments.length) return this.segments;
        // segment counting from last segment
        if (index < 0) index = this.segments.length + index;

        return this.segments[index];
    }

    /**
     * Prepend a string and return a new PathObject.
     * @param what string
     * @returns {PathObject}
     */
    prepend(what)
    {
        return new PathObject(what + this._string);
    }

    /**
     * Get or change the extension.
     * @param changeTo String
     * @returns {PathObject|String}
     */
    extension(changeTo)
    {
        // If not changing the extension, return the extension.
        if (! changeTo) {
            return path.extname(this._string);
        }
        let basename = path.basename(this._string, path.extname(this._string));
        let parts = this._string.split("/");
        parts.pop();
        parts.push(basename + "." + changeTo);

        // Return a new PathObject instance.
        return new PathObject(parts.join("/"));
    }

    /**
     * Get the value of this object.
     * @returns {String}
     */
    toValue() {
        return this._string;
    }

    /**
     * Return this object as a string.
     * @returns {String}
     */
    toString() {
        return this._string;
    }
}



module.exports = PathService;