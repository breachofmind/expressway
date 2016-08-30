"use strict";

var Provider = require('../provider');
var ejs = require('ejs');
var fs = require('fs');
var _ = require('lodash');

/**
 * Provides the Template class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class TemplateProvider extends Provider
{
    constructor()
    {
        super('template');
    }

    register(app)
    {
        var utils = app.utils;

        var styles = {
            close: ejs.compile("<<%-element%> <%-attributes%>><%-text%></<%-element%>>"),
            open: ejs.compile("<<%-element%> <%-attributes%>/>")
        };

        var elementStyles = {
            link: styles.open,
            script: styles.close,
            meta: styles.open,
        };

        /**
         * The Template class, for building HTML documents.
         * @constructor
         */
        class Template
        {
            /**
             * Constructor
             * @param view View
             */
            constructor(view)
            {
                this._view = view;
                this._assets = [];
                this.title = "Untitled";
                this.bodyClass = [];

                this.meta('generator','ExpressMVC v.'+app.version);

                Template.defaults.call(this, view);
            }

            /**
             * Queue an element.
             * @param type string link|script|etc...
             * @param attrs object
             * @param order number
             * @returns {Template}
             */
            element(type, attrs, order)
            {
                new TemplateElement(type, attrs, order).addTo(this);
                return this;
            }

            /**
             * Queue a script.
             * @param name string id
             * @param src string
             * @returns {Template}
             */
            script(name,src)
            {
                return this.element('script', {id:name,type:"text/javascript",src:src}, 2);
            }

            /**
             * Queue a stylesheet.
             * @param name string id
             * @param href string
             * @returns {Template}
             */
            style(name,href)
            {
                return this.element('link', {id:name, type:"text/css", rel:"stylesheet", href:href}, 1);
            }

            /**
             * Add metadata.
             * @param key string
             * @param value string
             * @returns {Template}
             */
            meta(key,value)
            {
                return this.element('meta', {name:key, content:value}, 0);
            }

            /**
             * Get any assets of the given element(s).
             * @param arr Array optional
             * @returns {string}
             */
            get(arr)
            {
                this._assets.sort(function(a,b) {
                    return a.order === b.order ? 0 : (a.order > b.order ? 1:-1);
                });
                return this._assets.map(function(asset) {
                    if (Array.isArray(arr) && arr.indexOf(asset.element) == -1) {
                        return "";
                    }
                    return asset.render();
                }).join("\n");
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


        /**
         * Template element class.
         * For adding common stuff to the template.
         */
        class TemplateElement
        {
            /**
             * Constructor.
             * @param element string link|script|meta
             * @param attributes object
             * @param order number
             */
            constructor(element,attributes,order)
            {
                this.element = element.toLowerCase();
                this.template = elementStyles[this.element] ? elementStyles[this.element] : styles.close;
                this.attributes = attributes;
                this.text = "";
                this.order = order || 0;
                if (this.element == 'script') this.mtime('src');
                if (this.element == 'link') this.mtime('href');
            }

            /**
             * If a file exists on the server, add the mtime to it.
             * @param attr string
             * @returns {TemplateElement}
             */
            mtime(attr)
            {
                var publicPath = app.publicPath( _.trim(this.attributes[attr],"/") );
                if (this.attributes[attr] && fs.existsSync(publicPath)) {
                    var mtime = fs.statSync(publicPath).mtime.getTime();
                    this.attributes[attr] += "?m="+mtime;
                }
                return this;
            }

            /**
             * Render the element string.
             * @returns {string}
             */
            render()
            {
                return this.template({
                    text: this.text,
                    element: this.element,
                    attributes: utils.spreadAttributes(this.attributes)
                })
            }

            /**
             * Add the element to the template.
             * @param template Template
             * @returns {TemplateElement}
             */
            addTo(template)
            {
                template._assets.push(this);
                return this;
            }
        }

        app.Template = Template;
    }
}

module.exports = new TemplateProvider();