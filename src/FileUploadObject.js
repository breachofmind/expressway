"use strict";

var Promise = require('bluebird');
var mime    = require('mime-types');
var fs      = require('fs');
var path    = require('path');
var _       = require('lodash');

/**
 * These are the only types that can be read by sharp.
 * @type {[String]}
 */
const IMAGE_MIMETYPES = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/gif",
    "image/webp",
    "image/svg+xml",
];

class FileUploadObject
{
    /**
     * Constructor.
     * @param file {object} which is created by multer middleware
     * @param destPath {String}
     */
    constructor(file,destPath)
    {
        /**
         * The uploaded file object.
         * @type {Object}
         * @private
         */
        this._file = file;

        /**
         * The uploaded source file name.
         * @type {string}
         */
        this.srcFile = file.filename;
        /**
         * The uploaded source file path.
         * @type {string}
         */
        this.srcPath = _.trimEnd(file.destination,"/") + "/";
        /**
         * The destination file path.
         * @type {string}
         */
        this.destPath = _.trimEnd(destPath,"/") + "/";
        /**
         * The destination file name.
         * This is changed from the original name if the file exists on the server.
         * @type {String}
         */
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
        return this._file.size || fs.statSync(this.sourcePath).size;
    }

    /**
     * The the original file extension.
     * @returns {String}
     */
    get extension()
    {
        return path.extname(this._file.originalname);
    }

    /**
     * Get the title of the file.
     * @returns {String}
     */
    get title()
    {
        return path.basename(this._file.originalname, this.extension);
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
     * Is this an image that can be manipulated?
     * @returns {Boolean}
     */
    get isImage()
    {
        return IMAGE_MIMETYPES.indexOf(this.mimetype) > -1;
    }

    /**
     * Get the source path to the file.
     * @returns {String}
     */
    get sourcePath()
    {
        return this.srcPath + this.srcFile;
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
            fs.unlink(this.sourcePath, function(err,result) {
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
     * Copy the file to the destination path.
     * @param deleteOriginal {Boolean}
     * @returns {Promise}
     */
    copy(deleteOriginal=false)
    {
        let rs = fs.createReadStream(this.sourcePath);
        let ws = fs.createWriteStream(this.destinationPath());

        return new Promise((resolve,reject) =>
        {
            rs.on('error', err => { reject(err) });
            ws.on('error', err => { reject(err) });
            ws.on('close', ex => {
                if (deleteOriginal) {
                    return this.remove().then(done => {
                        resolve(true);
                    }).catch(err => {
                        reject(err);
                    });
                }
                return resolve(true);
            });

            rs.pipe(ws);
        })
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
        let originalName = this._file.originalname;
        let baseName = path.basename(originalName, this.extension);
        let basePath = this.isImage ? this.destPath + "original/" : this.destPath;
        let dest = () => {
            if (sequence == 0) {
                return basePath + originalName;
            }
            return basePath + `${baseName}_(${sequence})${this.extension}`;
        };
        while (fs.existsSync( dest() )) { sequence ++ }

        return path.basename( dest() );
    }
}


module.exports = FileUploadObject;