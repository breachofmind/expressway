"use strict";

var Middleware       = require('../Middleware');
var FileUploadObject = require('../FileUploadObject');
var multer           = require('multer');

const DEFAULT_MIMETYPE = "application/octet-stream";

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

module.exports = MultipartForm;

