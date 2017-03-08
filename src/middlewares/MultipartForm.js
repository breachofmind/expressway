"use strict";

var Middleware = require('../Middleware');
var Promise    = require('bluebird');
var multer     = require('multer');
var mime       = require('mime-types');
var fs         = require('fs');
var path       = require('path');
var _          = require('lodash');

const DEFAULT_MIMETYPE = "application/octet-stream";
const IMAGE_MIMETYPES = [
    mime.lookup('jpg')
]

class MultipartForm extends Middleware
{
    get description() {
        return "Parses multipart/form-data requests";
    }

    dispatch(extension,paths,config,app)
    {
        // This is where temporary uploaded files will be stored.
        let upload = multer({
            dest: paths.tmp('uploads')
        });

        /**
         * If there are any file objects, convert them to FileUpload objects.
         * @param request
         * @param response
         * @param next
         */
        function postUpload(request,response,next)
        {
            if (request.files && request.files.length) {
                request.files = request.files.map(fileObject => {
                    return new FileUploadObject(fileObject,paths.uploads());
                })
            }
            next();
        }

        return [
            upload.array('file', config('fileUploadLimit', 10)),
            postUpload
        ]
    }
}

class FileUploadObject
{
    constructor(file,destPath)
    {
        this._file = file;

        this.origFile = file.originalname;
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
        return mime.lookup(this.destFile) || DEFAULT_MIMETYPE;
    }

    /**
     * Create a path to the new file, given a directory.
     * @param dir {String}
     * @returns {String}
     */
    path(dir="")
    {
        return path.join(this.destPath, dir, this.destFile);
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
        return this.path("");
    }
}

module.exports = MultipartForm;

