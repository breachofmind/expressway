"use strict";

var Promise = require('bluebird');
var mime    = require('mime-types');
var fs      = require('fs');
var path    = require('path');
var _       = require('lodash');

class FileUploadObject
{
    constructor(file,destPath)
    {
        this._file = file;

        this.origFile = file.originalname;
        this.origPath = _.trimEnd(file.destination,"/") + "/";
        this.destPath = _.trimEnd(destPath,"/") + "/";
        this.destFile = this._getDestFileName();
    }

    /**
     * The original uploaded file object.
     * @returns {*}
     */
    get file() {
        return file;
    }

    /**
     * Get the size of the file.
     * @returns {Number}
     */
    get size() {
        return this._file.size || fs.statSync(this.originalPath).size;
    }

    /**
     * The the original file extension.
     * @returns {String}
     */
    get extension()
    {
        return path.extname(this.origFile);
    }

    /**
     * Get the destination file mime type.
     * @returns {String}
     */
    get mimetype()
    {
        return this._file.mimetype || mime.lookup(this.destFile) || DEFAULT_MIMETYPE;
    }

    /**
     * Get the original path to the file.
     * @returns {String}
     */
    get originalPath()
    {
        return this.origPath + this.origFile;
    }

    /**
     * Create a path to the new file, given a directory.
     * @param dir {String}
     * @returns {String}
     */
    destinationPath(dir="")
    {
        return path.join(this.destPath, dir, this.destFile);
    }

    /**
     * Remove this file from the server.
     * @returns {Promise}
     */
    remove()
    {
        return new Promise((resolve,reject) =>
        {
            fs.unlink(this._file.path, function(err,result) {
                if (err) return reject(err);

                return resolve(result);
            });
        });
    }

    /**
     * Convert this to the destination path string.
     * @returns {String}
     */
    toString()
    {
        return this.destinationPath("");
    }

    /**
     * Return the destination file name.
     * If the file exists at the destination, create a unique sequence name.
     * @returns {String}
     * @private
     */
    _getDestFileName()
    {
        let sequence = 0;
        let basename = path.basename(this.origFile, `${this.extension}`);
        let dest = () => {
            if (sequence == 0) {
                return this.destPath + this.origFile;
            }
            return this.destPath + `${basename}-${sequence}${this.extension}`;
        };
        while (fs.existsSync( dest() )) { sequence ++ }

        return path.basename( dest() );
    }
}

module.exports = FileUploadObject;