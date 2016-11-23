"use strict";

var Expressway = require('expressway');
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

        this.requires('AppModule');
    }

    /**
     * Register the mail function with the application.
     * @param app Application
     * @param AppModule Module
     * @param config function
     */
    register(app,config,AppModule)
    {
        // This is inside the register method in
        // case the user didn't load it.
        var nodemailer = require('nodemailer');
        var stubTransport = require('nodemailer-stub-transport');

        var transport = nodemailer.createTransport( config('nodemailer_transport', stubTransport()) );

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
                    return AppModule.express.render(options.view, options.data || {}, function(err,html) {
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