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
        var View = require('../classes/View');

        Expressway.View = View;

        // Attach the View class to the application.
        app.register('View', View, "A wrapper class around HTML views and templates");
    }
}

/**
 * Alias to create a view.
 * @param file string
 * @param data object|null optional
 * @returns {View}
 */
http.ServerResponse.prototype.view = function(file,data)
{
    return Expressway.View.create(file,data);
};

module.exports = ViewProvider;