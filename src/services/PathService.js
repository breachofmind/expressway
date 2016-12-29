"use strict";

var _    = require('lodash');
var path = require('path');
var fs   = require('fs');

var ObjectCollection = require('../ObjectCollection');

module.exports = function(app,debug)
{
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
         * Write a string to this file.
         * @param str String
         */
        write(str)
        {
            return fs.writeFileSync(this._string, str);
        }

        /**
         * Read a file.
         * @returns {Buffer}
         */
        read()
        {
            return fs.readFileSync(this._string);
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

    /**
     * The path service container.
     */
    return new class PathService extends ObjectCollection
    {
        constructor()
        {
            super(app,'path');

            this._objects = {};
        }

        /**
         * Return the objects functions.
         * @returns {{}}
         */
        get build()
        {
            return this._objects;
        }

        /**
         * Add a path.
         * @param name string
         * @param value string
         * @returns {PathService}
         */
        add(name,value)
        {
            let setPath = _.trimEnd(path.normalize( value.toString() ), "/");

            super.add(name,setPath);

            // Create a accessor function that returns a string.
            this[name] = (uri) => {
                return this.to(name, uri);
            };
            // Create an accessor that returns a PathObject.
            // IE: paths.object.root("uri");
            this._objects[name] = (uri) => {
                return this.object(name, uri);
            };

            debug('PathService added: %s -> %s', name,setPath);

            return this;
        }

        /**
         * Create a path to the given uri.
         * @param name {String}
         * @param uri {String|Array}
         * @returns {String}
         */
        to(name, uri="")
        {
            let str = this.get(name);
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
};


