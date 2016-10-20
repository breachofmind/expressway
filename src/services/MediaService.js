"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var Path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var sharp = require('sharp');

var [url,path,log,debug] = app.get('url','path','log','debug');

/**
 * A class for common image manipulations.
 * @constructor
 */
class MediaService
{
    constructor(sizes = {})
    {
        this.sizes = {};
        this.degradation = ['thumb','medium','large','original'];

        Object.keys(sizes).forEach(size => {
            this.add(size, sizes[size]);
        })
    }

    /**
     * Return the path to a file.
     * Resolves to a lesser file size if the given file size doesn't exist.
     * @param fileName string
     * @param size string
     * @returns {string|null}
     */
    path(fileName, size)
    {
        var resolvedSize = this.size(fileName,size);
        if (! resolvedSize) {
            return null;
        }
        return path.uploads(resolvedSize+"/"+fileName);
    }

    /**
     * Like path(), only returns a URL to the image.
     * @param fileName string
     * @param size string
     * @param notFound string - optional
     * @returns {string|null}
     */
    url(fileName, size, notFound = null)
    {
        var resolvedSize = this.size(fileName,size);
        if (! resolvedSize) {
            return notFound;
        }
        return url("uploads/"+resolvedSize+"/"+fileName); // Todo, dynamic
    }

    /**
     * Given the size and file name,
     * check for the size or next best size.
     * @param fileName string
     * @param size string
     * @returns {string|null}
     */
    size(fileName, size)
    {
        if (! this.has(size)) return null;

        var index = this.degradation.indexOf(size);

        for(index; index < this.degradation.length; index++) {

            var file = path.uploads(this.degradation[index]+"/"+fileName);

            // This file size does exist.
            if (fs.existsSync(file)) {
                return this.degradation[index];
            }
        }
        return null;
    }


    /**
     * Check if a given size is registered.
     * @param size string
     * @returns {boolean}
     */
    has(size)
    {
        return this.sizes.hasOwnProperty(size);
    }

    /**
     * Generate a new size.
     * @param size string
     * @param inputFile string
     * @param outputFile string|function
     * @returns {*}
     */
    generate(size, inputFile, outputFile)
    {
        if (! this.sizes[size]) {
            throw new Error(`No size configured for "${size}"`);
        }
        var image = sharp(inputFile);

        // If the size is called and returns false,
        // don't allow the manipulation to occur.
        return image.metadata().then(meta =>
        {
            meta.size = size;
            var modified = this.sizes[size].call(null, image, meta, sharp);
            if (! modified) {
                return null;
            }
            var outputFileName = typeof outputFile == 'function' ? outputFile(inputFile,meta) : outputFile;

            log.info("Creating File: %s -> %s",inputFile, outputFileName);

            return modified.toFile(outputFileName);
        });
    }

    /**
     * Special method for uploading a file.
     * Saves the file in the given size directories.
     * @param inputFile string
     * @param sizes array
     * @returns {Promise}
     */
    upload(inputFile, sizes = ['original','thumb','medium','large'])
    {
        var promises = sizes.map(size =>
        {
            return this.generate(size, inputFile, function(filePath, meta) {
                var fileName = Path.basename(filePath);
                return path.uploads(size+"/"+fileName);
            })
        });

        return Promise.all(promises);
    }

    /**
     * Add a new size manipulator, as well as an uploads path and method.
     * @param name string
     * @param manipulator function
     */
    add(name, manipulator)
    {
        debug(this, "Adding size: %s", name);

        this.sizes[name] = manipulator;

        path.set("uploads_"+name, path.uploads(name), true);

        this[name] = function(inputFile,outputFile) {
            return this.generate(name, inputFile, outputFile);
        }
    }
}

module.exports = MediaService;