"use strict";

var pug = require('pug');
var fs = require('fs');

var app,config;

class Template
{
    static boot()
    {
        if (!app) {
            app = require('./application').instance;
            config = app.config;
        }
    }
    /**
     * Constructor
     * @param title string
     */
    constructor(title)
    {
        Template.boot();

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
        var order = ['metas','scripts','styles'];

        if (this.description) {
            this.meta('description',this.description);
        }

        order.forEach(function(container)
        {
            template[container].forEach(function(file) {
                out.push(file instanceof TemplateFile ? file.render() : file);
            });
        });
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

var _fileTemplate = {
    link: pug.compile('link(rel="stylesheet", type="text/css", href=attributes.src)'),
    script: pug.compile('script(src=attributes.src, type="text/javascript")'),
    meta: pug.compile('meta(name=name, content=attributes.value)')
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

        if (this.exists) {
            this.attributes.src += "?m="+fs.statSync(this.attributes.src).mtime.getTime();
        }

    }

    /**
     * If a file, check if it exists.
     * @returns {boolean}
     */
    get exists()
    {
        return this.attributes.src && fs.existsSync(this.attributes.src);
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

module.exports = Template;