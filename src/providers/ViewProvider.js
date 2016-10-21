"use strict";

var Expressway = require('expressway');
var http = require('http');

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

        this.contexts = [CXT_TEST, CXT_WEB];
    }

    /**
     * Register the View class.
     * @param app Application
     */
    register(app)
    {
        // Expose as a public class.
        Expressway.View = require('../classes/View');

        function createView (name,data) {
            return new Expressway.View(name,data);
        }

        app.register('view', createView, "Helper function for creating a view class instance")
    }
}

module.exports = ViewProvider;