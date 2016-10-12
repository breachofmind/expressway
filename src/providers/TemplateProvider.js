"use strict";

var Expressway = require('Expressway');

/**
 * Provides the Template class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class TemplateProvider extends Expressway.Provider
{
    /**
     * Register with the application.
     * @param app Application
     */
    register(app)
    {
        var Template = require('./classes/Template');

        Expressway.Template = Template;

        app.register('Template', Template);
    }
}

module.exports = TemplateProvider;