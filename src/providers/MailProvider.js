"use strict";

var Expressway = require('expressway');
var Promise    = require('bluebird');
var nodemailer = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');

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

        this.requires('CoreProvider');
    }

    /**
     * Register the mail function with the application.
     * @param app Application
     * @param $app Module
     * @param config function
     */
    register(app,config,$app)
    {
        var transport = nodemailer.createTransport( config('nodemailer_transport', stubTransport()) );

        /**
         * Using a promise, send mail with the given options.
         * You can pass options.view = view name to render an HTML email using express template engine.
         * @param options object
         * @param renderer express
         */
        function sendMail(options, renderer=$app.express)
        {
            return new Promise((resolve,reject) =>
            {
                var callback = (err,info) => {
                    return err ? reject(err) : resolve(info);
                };
                if (options.view) {
                    return renderer.render(options.view, options.data || {}, function(err,html) {
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