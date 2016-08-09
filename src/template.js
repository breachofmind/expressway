"use strict";

var ejs = require('ejs');
var fs = require('fs');

module.exports = function TemplateProvider(app)
{
    var config = app.config;

    class Template
    {
        /**
         * Constructor
         * @param title string
         */
        constructor(title)
        {
            this.title          = title;
            this.user           = null;
            this.description    = "";
            this.bodyClass      = [];
            this.scripts        = [];
            this.styles         = [];
            this.metas          = [];

            this.meta('viewport','width=device-width');

            if (app.environment === "local" && config.livereload) {
                this.script("livereload", config.livereload);
            }

            Template.defaults(this);
        }

        setUser(user)
        {
            if (user) {
                this.user = user;
                this.meta('user', user._id);
            }

            return this;
        }


        script(name,src)
        {
            this.scripts.push(new TemplateFile("script",name, src));
            return this;
        }

        style(name,src)
        {
            this.styles.push(new TemplateFile("link",name,src));
            return this;
        }

        meta(key,value)
        {
            this.metas.push(new TemplateFile("meta",key,{key:key,value:value}));
            return this;
        }

        /**
         * Return the <head> string output.
         * @returns {string}
         */
        head()
        {
            var template = this;
            var out = [];
            var order = arguments.length ? arguments : ['metas','scripts','styles'];

            for (var i=0; i<order.length; i++) {
                template[order[i]].forEach(function(file) {
                    out.push(file instanceof TemplateFile ? file.render() : file);
                });
            }

            return out.join("\n");
        }

        /**
         * Named constructor.
         * @param title string
         * @returns {Template}
         */
        static create(title)
        {
            return new Template(title);
        }
    }

    /**
     * Apply any defaults to the template.
     * @param template
     * @returns {*}
     */
    Template.defaults = function(template)
    {
        return template;
    };


    var _fileTemplate = {
        link: ejs.compile('<link id="<%=attributes.id%>" rel="stylesheet" type="text/css" href="<%= attributes.src %>"/>'),
        script: ejs.compile('<script id="<%=attributes.id%>" type="text/javascript" src="<%= attributes.src %>"></script>'),
        meta: ejs.compile('<meta name="<%=name%>" content="<%=attributes.value%>"/>')
    };

    var _jsonProperties = ['name','element','attributes'];
    /**
     * Template file class.
     * Used for script,style and meta tags.
     */
    class TemplateFile
    {
        constructor(element, name, attr)
        {
            this.element    = element;
            this.name       = name;
            this.template   = _fileTemplate[element] || null;
            this.attributes = typeof attr == "string" ? {src:attr} :  attr;
            if (! this.attributes.id) {
                this.attributes.id = element+"_"+name;
            }

            if (this.exists) {
                this.attributes.src += "?m="+fs.statSync(this.publicPath).mtime.getTime();
            }

        }

        /**
         * Return the attributes src public path.
         * @returns {string}
         */
        get publicPath()
        {
            return require('./application').publicPath(this.attributes.src);
        }

        /**
         * If a file, check if it exists.
         * @returns {boolean}
         */
        get exists()
        {
            return this.attributes.src && fs.existsSync(this.publicPath);
        }

        /**
         * Return a JSON object for the template.
         * @returns {Array}
         */
        toJSON()
        {
            var out = {};
            _jsonProperties.forEach(function(prop){
                out[prop] = this[prop];
            }.bind(this));
            return out;
        }

        /**
         * Render the template.
         * @returns {*}
         */
        render()
        {
            if (! this.template) {
                return "";
            }
            return this.template(this.toJSON());
        }
    }

    return Template;
};