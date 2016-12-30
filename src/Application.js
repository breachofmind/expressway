"use strict";

var path         = require('path');
var EventEmitter = require('events');
var Provider     = require('./Provider');
var utils        = require('./support/utils');
var _            = require('lodash');

var ObjectCollection = require('./ObjectCollection');
var Extension = require('./Extension');
var Provider = require('./Provider');
var Controller = require('./Controller');
var Middleware = require('./Middleware');
var Model = require('./Model');

const CLASS_COLLECTIONS = {
    providers: Provider,
    controllers: Controller,
    middleware: Middleware,
    extensions: Extension,
    models: Model,
}

class Root extends Extension {}

/**
 * An Application instance is a container for all
 * services, providers, and express extensions.
 */
class Application extends EventEmitter
{
    /**
     * Constructor.
     * @param rootPath String
     * @param config Object
     * @param context String
     */
    constructor(rootPath, config, context)
    {
        super();

        this._booted      = false;
        this._config      = config;
        this._rootPath    = rootPath;
        this._context     = context;
        this._environment = config.env;
        this._package     = require('../package.json');
        this._services    = new ObjectCollection(this, 'service');
        this._aliases     = new ObjectCollection(this, 'alias');

        // This is globally available to all objects.
        this.service('app',    this);
        this.service('utils',  utils);
        this.service('config', utils.objectAccessor(config));

        // Logger and debug function are configurable.
        this.service('log', config.logger
            ? this.load(config.logger)
            : this.load('./services/LogService'));

        this.service('debug', config.debugger
            ? this.load(config.debugger)
            : this.get('log').debug);

        this.service('paths',  this.load('./services/PathService'));
        this.service('url',    this.load('./services/URLService'));
        this.service('locale', this.load('./services/LocaleService'));

        this._providers   = this.load('./services/ProviderService');
        this._models      = this.load('./services/ModelService');
        this._extensions  = this.load('./services/ExtensionService');
        this._controllers = this.load('./services/ControllerService');
        this._middleware  = this.load('./services/MiddlewareService');
        this._dispatcher  = this.load('./services/Dispatcher');

        this.call(this,'init');
    }

    /**
     * Initial application setup.
     * @param config
     * @param paths
     */
    init(config,paths)
    {
        paths.add('root', this.rootPath);
        _.each(config('paths', []), (value,key) => {
            if (value.startsWith(".")) value = value.splice(0,1,this.rootPath);
            paths.add(key,value);
        });

        // Create a base extension to add routes.
        this.extensions.add('root', config('root',Root));
    }

    /**
     * Return the name of the constructor.
     * @returns {String}
     */
    get name() {
        return this.constructor.name;
    }

    /**
     * Return the base extension.
     * @returns {Extension}
     */
    get root() {
        return this.extensions.get('root');
    }

    /**
     * Get the context.
     * @returns {String}
     */
    get context() {
        return this._context;
    }

    /**
     * Set the context.
     * @param value {String} web|cli|test
     */
    set context(value)
    {
        if (typeof value !== 'string') {
            throw new TypeError('context must be a string');
        }
        if (CXT_ALL.indexOf(value) == -1) {
            throw new Error('context must equal web,cli or test');
        }
        this._context = value;
    }

    /**
     * Get the environment.
     * @returns {String}
     */
    get env() {
        return this._environment;
    }

    /**
     * Get the config object.
     * @returns {Object}
     */
    get config() {
        return this._config;
    }

    /**
     * Get the normalized root path.
     * @returns {String}
     */
    get rootPath() {
        return path.normalize(this._rootPath);
    }

    get dispatcher() {
        return this._dispatcher;
    }

    get middleware() {
        return this._middleware;
    }

    get controllers() {
        return this._controllers;
    }

    get services() {
        return this._services;
    }

    get providers() {
        return this._providers;
    }

    get extensions() {
        return this._extensions;
    }

    get models() {
        return this._models;
    }

    get version() {
        return this._package.version;
    }

    get booted() {
        return this._booted;
    }

    /**
     * Load a module with the Application as a dependency.
     * Will also inject services into it.
     * A module should be a function with the first argument being the Application instance.
     * @param module string|function
     * @param args Array
     * @returns {*}
     */
    load(module,args=[this])
    {
        let fn = typeof module == 'string' ? require(module) : module;
        return this.call(fn,args);
    }

    /**
     * Get or set a service.
     * @param name string
     * @param service *
     * @returns {*|Application}
     */
    service(name,service)
    {
        if (arguments.length == 1)
        {
            if (typeof name == 'string') {
                return this.services.get(name);
            } else if (typeof name == 'function' && name.name) {
                return this.service(name.name,name);
            }
            throw new TypeError('first argument must be string or named function');
        }
        if (typeof name !== 'string') {
            throw new TypeError('service name must be string');
        }
        return this.services.add(name,service);
    }

    /**
     * Return one or more services.
     * @param serviceNames string
     * @returns {Array|*}
     */
    get(...serviceNames)
    {
        let services = serviceNames.map(serviceName => {
            return this.service(serviceName);
        });
        return services.length == 1 ? services[0] : services;
    }

    /**
     * Add an object to the Application.
     * @param fn Function|Array
     * @returns {Application}
     */
    use(fn)
    {
        if (! fn) return this;

        if (Array.isArray(fn)) {
            fn.forEach(item => { this.use(item) });

            return this;
        }

        try {
            let value = this.load(fn);

            _.each(CLASS_COLLECTIONS, (Class,property) => {
                if (value && value instanceof Class) {
                    this[property].add(value.name, value);
                }
            });
        } catch (err) {

            // When adding classes via app.use(), we're going to let it slide if the objects exist.
            let isObjectExistError = err instanceof ObjectExistsException
                || (err instanceof ApplicationCallError && err.thrown instanceof ObjectExistsException);

            if (! isObjectExistError) throw err;
        }

        return this;
    }

    /**
     * Get or set an alias.
     * @param name string
     * @param string string
     * @returns {String|Application}
     */
    alias(name,string)
    {
        if (arguments.length == 1) {
            return this._aliases.get(name);
        } else if (typeof string !== 'string') {
            throw new TypeError('alias is not a string: '+name);
        }
        this._aliases.add(name,string);

        return this;
    }

    /**
     * Call a method or function with the services injected.
     * The function arguments should be the service names.
     * @param params context:function|object,method:string|args:Array,args:Array
     * @throws TypeError|ApplicationCallError
     * @returns {*}
     */
    call(...params)
    {
        let context,method,args=[];

        switch(params.length) {
            case 3:
                [context,method,args] = params;
                break;
            case 2:
                if (typeof params[1] === 'string') {
                    [context,method] = params;
                } else if (Array.isArray(params[1])) {
                    [context,args] = params;
                }
                break;
            case 1:
                context = params[0];
                break;
        }

        if (! context) throw new TypeError('context must be object with a method name or function');

        // This is a method on an object.
        if (method) {
            if (typeof context !== 'object')
                throw new ApplicationCallTypeError(`context must be an object if method name given`,context,method);
            if (typeof context[method] !== 'function')
                throw new ApplicationCallTypeError(`context method must be a function`,context,method);

            try {
                // Return the context method function injected with services.
                return context[method].apply(context, this.inject(context[method], args));
            } catch (err) {
                throw new ApplicationCallError(err,context,method);
            }
        }

        // After this point, the context must be a function.
        if (typeof context !== 'function') {
            throw new ApplicationCallTypeError(`context must be a function`,context,method);
        }


        try {
            // This is a class or constructor function.
            // This is difficult to detect, hence the function $constructor property.
            if (context.prototype && context.$constructor !== false) {
                let services = this.inject(context.prototype.constructor, args);
                return new context(...services);
            }

            // This is just a regular function.
            return context.apply(context, this.inject(context, args));

        } catch(err) {
            throw new ApplicationCallError(err, context,method);
        }
    }


    /**
     * Given a function with arguments,
     * find the services matching the argument names.
     * @param fn Function
     * @param padding Array
     * @returns {Array}
     */
    inject(fn,padding=[])
    {
        let serviceNames = utils.annotate(fn);

        return serviceNames.map((serviceName,index) =>
        {
            if (padding[index]) return padding[index];
            let service = this._services.get(serviceName);

            // When a service is injected, it can be called again with the padding arguments.
            // Useful if injecting services into a middleware function.
            // Be careful of a stack overflow here!
            if (typeof service == 'function' && service.$call) {
                return this.call(service,null,padding);
            }
            return service;
        });
    }

    /**
     * Bootstrap the application if not booted.
     * @returns {Application}
     */
    boot()
    {
        if (! this.booted)
        {
            this.providers.boot();
            this.models.boot();
            this.extensions.boot();

            this._booted = true;
        }

        return this;
    }

    /**
     * Start the express server.
     * Uses the base extension.
     * @returns void
     */
    start(listening=null)
    {
        this.boot();

        let [log,url] = this.get('log','url');

        this.root.express.listen(this.config.port, () =>
        {
            log.info('using root path: %s', this.rootPath);
            log.info(`starting %s server v.%s on %s`,
                this.env,
                this.version,
                url.get()
            );

            this.emit('listening');

            if (typeof listening == 'function') this.call(listening);
        });
    }
}

module.exports = Application;