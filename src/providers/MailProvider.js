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

        this.requires = ['URLProvider'];

        // Use the configuration setting.
        // Otherwise, use the stub transport for testing purposes.
        this.transport = nodemailer.createTransport( app.conf('nodemailer_transport', stubTransport()) );
    }

    /**
     * Register the mail function with the application.
     * @param app Application
     */
    register(app)
    {
        var transport = this.transport;

        /**
         * Using a promise, send mail with the given options.
         * @param options object
         */
        function sendMail(options)
        {
            return new Promise((resolve,reject) => {
                transport.sendMail(options, function(err,info) {
                    if (err) return reject(err,info);

                    return resolve(info);
                });
            });
        }

        app.register('mail', sendMail, "Nodemailer transport for sending email");
    }
}

module.exports = MailProvider;