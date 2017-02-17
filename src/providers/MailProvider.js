"use strict";

var Provider      = require('../Provider');
var Promise       = require('bluebird');
var nodemailer    = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');

/**
 * Provides helper functions for Nodemailer.
 * @author Mike Adamczyk <mike@bom.us>
 */
class MailProvider extends Provider
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

        let transport = nodemailer.createTransport( config('nodemailer_transport', stubTransport()) );

        /**
         * Using a promise, send mail with the given options.
         * You can pass options.view = view name to render an HTML email using express template engine.
         * @param options object
         * @param extension Extension
         */
        function mail(options, extension=app.root)
        {
            if (typeof options !== 'object') {
                throw new TypeError('options object required for mail function');
            }
            return new Promise((resolve,reject) =>
            {
                var callback = (err,info) => {
                    return err ? reject(err) : resolve(info);
                };
                if (options.view) {
                    return extension.express.render(options.view, options.data || {}, function(err,html) {
                        if (err) return reject(err);
                        options.html = html;
                        transport.sendMail(options,callback);
                    });
                }
                return transport.sendMail(options,callback);
            });
        }

        app.service(mail);
    }
}

module.exports = MailProvider;