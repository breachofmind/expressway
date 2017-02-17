"use strict";

var Provider = require('../Provider');
var Promise  = require('bluebird');
var crypto   = require('crypto');
var fs       = require('fs');

/**
 * Provides helper functions.
 * @author Mike Adamczyk <mike@bom.us>
 */
class HelperProvider extends Provider
{
    /**
     * Constructor.
     * @param app Application
     * @param config Function
     */
    constructor(app,config)
    {
        super(app);

        this.order = 0;

        /**
         * Convert a string to md5 hash.
         * @param string {String}
         * @returns {String}
         */
        function md5(string)
        {
            let md5sum = crypto.createHash('md5').update(string);
            return md5sum.digest('hex').toString();
        }

        /**
         * Convert a file to an md5 hash.
         * @param filename {String}
         * @returns {Promise}
         */
        function md5file(filename)
        {
            if (! fs.existsSync(filename)) {
                throw new Error('file does not exist: '+filename);
            }
            let md5sum = crypto.createHash('md5');

            return new Promise((resolve,reject) =>
            {
                let stream = fs.ReadStream(filename);
                stream.on('data', function(d) {
                    md5sum.update(d);
                });
                stream.on('end', function() {
                    resolve(md5sum.digest('hex').toString());
                });
            })
        }

        app.service(md5);
        app.service(md5file);
    }
}

module.exports = HelperProvider;