"use strict";

var Template = require('./template');

var app,config;

class View
{
    /**
     * Boot the class.
     * @param factory
     */
    static boot(factory)
    {
        if (!app) {
            app = require('./application').instance;
            config = app.config;
        }
    }

    /**
     * Constructor.
     * @param file string
     * @param data object|null
     */
    constructor(file,data)
    {
        View.boot(this);

        this.file = file;
        this.data = data||{};

        this.template = Template.create();
    }

    /**
     * Perform template actions.
     * @param property string
     * @param value mixed value
     * @returns {*}
     */
    set(property,value)
    {
        this.template[property] = value;
        return this;
    }

    /**
     * Combine data with this view.
     * @param data object
     * @returns {View}
     */
    and(data)
    {
        if (! data) return this;
        for (let prop in data)
        {
            this.data[prop] = data[prop];
        }
        return this;
    }

    /**
     * Render the view response.
     * @param request
     * @param response
     * @returns {*}
     */
    render(request,response)
    {
        this.template.setUser(request.user);
        this.template.meta('csrf-token',request.csrfToken());
        this.data.request = request;
        this.data.template = this.template;

        return response.render(this.file, this.data);
    }

    /**
     * Named constructor.
     * @param file string
     * @param data object
     * @returns {View}
     */
    static create(file,data)
    {
        return new View(file,data);
    }
}

module.exports = View;