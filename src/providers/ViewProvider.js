"use strict";

var Expressway = require('expressway');

/**
 * Provides a view helper class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class ViewProvider extends Expressway.Provider
{
    /**
     * Constructor
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = ['TemplateProvider'];
    }

    /**
     * Register the View class.
     * @param app Application
     */
    register(app)
    {
        var View = require('./classes/View');

        Expressway.View = View;

        // Attach the View class to the application.
        app.register('View', View, "A wrapper class around HTML views and templates");
    }
}

module.exports = ViewProvider;