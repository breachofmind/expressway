"use strict";

var Expressway = require('expressway');
var utils = Expressway.utils;
var app = Expressway.instance.app;
var _ = require('lodash');

/**
 * The view class, which combines data with the template.
 * @constructor
 */
class View
{
    /**
     * Constructor.
     * @param file string
     * @param data object
     */
    constructor(file,data={})
    {
        this.file     = file;
        this.module   = app.get('$app');
        this.data     = data;
        this.title    = undefined;

        this.tags = {
            scripts: [],
            styles: [],
            meta: []
        };

        // We're asking for a different express module.
        // An express module can have it's own views directory.
        if (file.indexOf(":") > -1)
        {
            let [module,view] = file.split(":");
            let $module = app.get(module);
            if (! ($module instanceof Expressway.Module)) {
                throw new Error(`${module} not instance of Module`);
            }
            this.file = view.trim();
            this.module = $module;
        }
    }

    /**
     * Enqueue a script for this view.
     * @param name string
     * @param src string
     * @param attrs object
     * @returns {View}
     */
    script(name,src,attrs={})
    {
        var el = utils.element('script', _.merge(attrs,{id:"_"+name, type:"text/javascript", src:src}) );
        this.tags.scripts.push(el);
        return this;
    }

    /**
     * Enqueue a style for this view.
     * @param name string
     * @param src string
     * @param attrs object
     * @returns {View}
     */
    style(name,src,attrs={})
    {
        var el = utils.element('link', _.merge(attrs,{id:"_"+name, type:"text/css", rel:"stylesheet", href:src}) );
        this.tags.styles.push(el);
        return this;
    }

    /**
     * Enqueue a meta tag.
     * @param name string
     * @param content string
     * @param attrs object
     * @returns {View}
     */
    meta(name,content,attrs={})
    {
        var el = utils.element('meta', _.merge(attrs,{name:name, content:content}) );
        this.tags.meta.push(el);
        return this;
    }


    /**
     * Combine data with this view.
     * @param key object|string
     * @param value null|*
     * @returns {View}
     */
    use(key,value=null)
    {
        if (typeof key == 'object') {
            _.each(key,(v,k) => this.data[k] = v);
        } else if (typeof key == 'string') {
            this.data[key] = value;
        }
        return this;
    }

    /**
     * Set the view title.
     * @param str string
     * @returns {View}
     */
    setTitle(str)
    {
        if (typeof str != 'string') {
            throw new TypeError('Title is not a string');
        }
        this.title = str;
        return this;
    }

    /**
     * Convert this view into a JSON format.
     * @param request
     * @returns {{}}
     */
    toJSON(request)
    {
        var json = {};
        json.title = this.title;
        _.each(this.data, (value,key) => { json[key] = value });
        _.each(this.tags, (arr,el) => { json[el] = arr.join("\n") });
        json.$view = this;
        if (request) json.request = request;
        return json;
    }

    /**
     * Render the view response.
     * @param response
     * @returns {*}
     */
    render(response)
    {
        app.emit('view.created', this, response.req);

        return this.module.express.render(this.file, this.toJSON(response.req), (err,str) => {
            if (err) return response.req.next(err);

            response.send(str);
        });
    }
}

module.exports = View;