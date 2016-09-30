"use strict";

var Expressway = require('expressway');
var app = Expressway.instance.app;
var _string = require('lodash/string');

/**
 * The view class, which combines data with the template.
 * @constructor
 */
class View
{
    /**
     * Constructor.
     * @param file string
     * @param data object|null
     */
    constructor(file,data)
    {
        this.file = file;
        this.data = data||{};

        this.template = Expressway.Template.create(this);
    }

    /**
     * Perform template actions.
     * @param property string|object
     * @param value mixed value
     * @returns {*}
     */
    set(property,value)
    {
        if (typeof property == 'object') {
            Object.keys(property).forEach(function(key) {
                this.template[key] = property[key];
            }.bind(this));
        } else {
            this.template[property] = value;
        }

        return this;
    }

    /**
     * Combine data with this view.
     * @param data object
     * @returns {View}
     */
    use(data)
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
        this.data.request = request;
        this.data.template = this.template;
        this.data.appVersion = app._version;
        this.data._ = _string;

        app.event.emit('view.created', this, request);

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