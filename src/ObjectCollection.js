"use strict";

var _ = require('lodash');
var EventEmitter = require('events');

/**
 * A special hash collection of objects.
 */
class ObjectCollection extends EventEmitter
{
    constructor(app,type)
    {
        super();

        /**
         * The Application instance.
         * @type Application
         */
        this._app = app;

        /**
         * The type of object in the collection.
         * @type {string}
         */
        this.type = type || "object";

        /**
         * The index of objects.
         * @type {{}}
         */
        this.index = {};

        /**
         * The order in which the objects were added.
         * @type {Array}
         */
        this.order = [];

        /**
         * The class associated with object instances.
         * @type {null|Function}
         */
        this.class = null;

        /**
         * When adding, create a service with the same name?
         * @type {boolean}
         */
        this.createService = false;
    }

    /**
     * Get the Application instance.
     * @returns {Application}
     */
    get app() {
        return this._app;
    }

    get name() {
        return this.constructor.name;
    }

    /**
     * Check if the given object name exists in the index.
     * @param name string
     * @param then Function - optional callback if exists.
     * @returns {boolean|*}
     */
    has(name, then)
    {
        let exists = this.index.hasOwnProperty(name);
        return typeof then == 'function' && exists ? then(this.get(name)) : exists;
    }

    /**
     * Add an object or array of objects.
     * if passing a function, uses the function constructor name.
     * @param args
     * @throws Error
     * @returns {*}
     */
    add(...args)
    {
        let name,value;

        if (! args.length) {
            throw new TypeError('no arguments given');
        } else if (Array.isArray(args[0])) {
            args[0].forEach(item => { this.add(item) });
            return this;
        } else if (args.length == 2) {
            [name,value] = args;
            if (typeof name !== 'string') {
                throw new TypeError('first argument must be a string');
            }
        } else if (typeof args[0] == 'function') {
            [name,value] = [args[0].name,args[0]];
        } else if (typeof args[0] == 'object') {
            name = args[0].name;
            value = args[0].object;
        }

        if (this.has(name)) {
            this.emit('exists', name);
            throw new ObjectExistsException(`${this.type} already exists`, this, name);
        }
        if (this.class) {
            value = this._getInstance(name,value);
        }

        this.index[name] = value;
        this.order.push(name);

        if (this.createService) {
            this.app.service(name,value);
        }

        this.emit('add', name,value);

        return this;
    }

    /**
     * Construct a class function.
     * @param name string
     * @param fn Function
     * @returns {Object}
     */
    _getInstance(name, fn)
    {
        let instance;

        // Could already be an instance.
        if (typeof fn == 'object' && fn instanceof this.class) {
            return fn;
        } else if (typeof fn !== 'function') {
            throw new TypeError(`not a function or ${this.type} class: ${name}`);
        }

        instance = this.app.call(fn,[this.app]);

        if (! (instance instanceof this.class)) {
            throw new TypeError(`not a ${this.class.name} instance: ${instance.name}`);
        }

        return instance;
    }

    /**
     * Get an object by name.
     * @param name string
     * @throws Error
     * @returns {*}
     */
    get(name)
    {
        if (! this.has(name)) {
            throw new Error(`${this.type} does not exist: ${name}`);
        }
        return this.index[name];
    }

    /**
     * Return an array of objects.
     * @param sort function - optional
     * @returns {Array}
     */
    list(sort=null)
    {
        if (! sort) sort = function(a,b) {
            return a.index == b.index ? 0 : (a.index > b.index ? 1 : -1);
        };
        return _.map(this.index, (value,key) => {
            return {
                index:this.order.indexOf(key),
                name:key,
                object:value,
            };
        }).sort(sort);
    }

    /**
     * Fire a callback on each item in the index.
     * @param callback function
     * @returns {Array}
     */
    each(callback)
    {
        if (typeof callback !== 'function') {
            throw new TypeError('callback function required');
        }
        return this.list().map((item,index) => {
            return callback(item.object,item.index,item.name);
        });
    }

    /**
     * Get all values in the index.
     * @returns {Array}
     */
    get all()
    {
        return _.values(this.index);
    }
}

module.exports = ObjectCollection;