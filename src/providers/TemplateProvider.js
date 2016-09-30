"use strict";

var Expressway = require('Expressway');

/**
 * Provides the Template class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class TemplateProvider extends Expressway.Provider
{
    register()
    {
        var Template = require('./classes/Template');

        Expressway.Template = Template;

        this.app.register('Template', Template);
    }
}

module.exports = TemplateProvider;