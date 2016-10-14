"use strict";

var Expressway = require('expressway');
var nodemailer = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');
var Promise    = require('bluebird');

/**
 * Provides helper functions for Nodemailer.
 * @author Mike Adamczyk <mike@bom.us>
 */
class MailProvider extends Expressway.Provider
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'URLProvider',
            'ExpressProvider'
        ];

        // Use the configuration setting.
        // Otherwise, use the stub transport for testing purposes.
        this.transport = nodemailer.createTransport( app.conf('nodemailer_transport', stubTransport()) );
    }

    /**
     * Register the mail function with the application.
     * @param app Application
     * @param express Express
     */
    register(app,express)
    {
        var transport = this.transport;

        /**
         * Using a promise, send mail with the given options.
         * You can pass options.view = view name to render an HTML email using express template engine.
         * @param options object
         */
        function sendMail(options)
        {
            return new Promise((resolve,reject) => {
                var callback = (err,info) => {
                    return err ? reject(err) : resolve(info);
                };
                if (options.view) {
                    return express.render(options.view, options.data || {}, function(err,html) {
                        if (err) return reject(err);
                        options.html = html;
                        transport.sendMail(options,callback);
                    });
                }
                return transport.sendMail(options,callback);
            });
        }

        app.register('mail', sendMail, "Nodemailer transport for sending email");
    }
}

module.exports = MailProvider;