"use strict";

var _ = require('lodash');
var utils = require('./support/utils');

/**
 * The view class, which combines data with the template.
 * @constructor
 */
class View
{
    /**
     * Constructor.
     * @param extension {Extension}
     * @param request {IncomingMessage}
     * @param response {ServerResponse}
     */
    constructor(extension,request,response)
    {
        this._req = request;
        this._res = response;
        this._renderer = extension;
        this._file = null;
        this._data = {
            title: undefined
        };
        this._tags = {
            scripts: [],
            styles: [],
            meta: []
        };

        this._app = extension.app;
    }

    /**
     * Return the Application instance.
     * @returns {Application}
     */
    get app() {
        return this._app;
    }

    /**
     * Get the file name.
     * @returns {String}
     */
    get file() {
        return this._file;
    }

    /**
     * Get the current extension.
     * @returns {Extension}
     */
    get extension() {
        return this._renderer;
    }

    /**
     * Set the template to render.
     * @param file string
     */
    template(file)
    {
        let extensionName;
        if (file.indexOf(":") > -1) {
            [extensionName,file] = file.split(":");
            this._renderer = this.app.extensions.get(extensionName);
        }
        this._file = file.trim();

        return this;
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
        this._tags.scripts.push(el);

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
        this._tags.styles.push(el);

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
        this._tags.meta.push(el);

        return this;
    }

    /**
     * Combine data with this view or wrap in a callback.
     * @param key object|string|function
     * @param value null|*
     * @returns {View}
     */
    use(key,value=null)
    {
        if (! key || ! arguments.length) return this;

        if (Array.isArray(key)) {
            key.forEach(item => this.use(item) );
        } else {
            if (typeof key == 'object') {
                _.each(key,(v,k) => this._data[k] = v);
            } else if (typeof key == 'string') {
                this._data[key] = value;
            } else if (typeof key == 'function') {
                key(this);
            }
        }

        return this;
    }

    /**
     * Get or set the title.
     * @param title string
     * @returns {String|View}
     */
    title(title)
    {
        if (! arguments.length) return this._data.title;
        this._data.title = title;
        return this;
    }

    /**
     * Convert this view into a JSON format.
     * @returns {{}}
     */
    toJSON()
    {
        var json = {
            $view: this,
            $request: this._req,
        };
        _.each(this._data, (value,key) => { json[key] = value });
        _.each(this._tags, (arr,el) => { json[el] = arr.join("\n") });

        return json;
    }

    /**
     * Render the view response.
     * @returns {*}
     */
    render()
    {
        this.app.emit('view.render', this, this._req, this._res);

        // This is modeled after express' response.render()
        // We can use our own sub-app's render function.
        // Sub-apps can have their own view engines and view paths.
        return this._renderer.express.render(this._file, this.toJSON(), (err,str) => {
            if (err) return this._req.next(err);

            this._res.send(str);
        });
    }
}

module.exports = View;