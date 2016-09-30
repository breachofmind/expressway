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
     */
    register()
    {
        var View = require('./classes/View');

        Expressway.View = View;

        // Attach the View class to the application.
        this.app.register('View', View);
    }
}

module.exports = ViewProvider;