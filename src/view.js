"use strict";
var lang = require('./support/lang').lang;

module.exports = function ViewProvider(app)
{
    var Template = app.Template;
    var config = app.config;

    if (app.View) {
        return app.View;
    }

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
            this.data.lang = lang(request);

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

    return View;
};