"use strict";

var path         = require('path');
var EventEmitter = require('events');
var Provider     = require('./Provider');
var utils        = require('./support/utils');
var _            = require('lodash');

var ObjectCollection = require('./ObjectCollection');
var Extension        = require('./Extension');
var Provider         = require('./Provider');
var Controller       = require('./Controller');
var Middleware       = require('./Middleware');
var Model            = require('./Model');
var Promise          = require('bluebird');

const COLLECTIONS = ['providers','controllers','middleware','extensions','models'];

/**
 * An Application instance is a container for all services, providers, and express extensions.
 *
 * @author Mike Adamczyk <mike@bom.us>
 * @since 0.1.0
 * @implements EventEmitter
 * @example
 * ```javascript
 * var app = expressway();
 * ```
 */
class Application extends EventEmitter
{
    /**
     * Create a new Application instance.
     * @param rootPath {String}
     * @param config {Object}
     * @param context {String}
     * @returns {Application}
     */
    constructor(rootPath, config, context)
    {
        super();

        this._clock       = utils.timer();
        this._booted      = false;
        this._config      = config;
        this._rootPath    = rootPath;
        this._context     = context;
        this._environment = config.env;
        this._package     = require('../package.json');
        this._services    = new ObjectCollection(this, 'service');
        this._aliases     = new ObjectCollection(this, 'alias');

        this.service('app',this);

        this.call(createBaseServices);

        this._providers   = this.load('./services/ProviderService');
        this._models      = this.load('./services/ModelService');
        this._extensions  = this.load('./services/ExtensionService');
        this._controllers = this.load('./services/ControllerService');
        this._middleware  = this.load('./services/MiddlewareService');
        this._dispatcher  = this.load('./services/Dispatcher');

        this.call(applicationInit);
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
     * Override the environment.
     * @param env {String}
     */
    set env(env)
    {
        this._environment = env;
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

    /**
     * Get the protected dispatcher service.
     * @returns {Dispatcher}
     */
    get dispatcher() {
        return this._dispatcher;
    }

    /**
     * Get the protected middleware service.
     * @returns {MiddlewareService}
     */
    get middleware() {
        return this._middleware;
    }
    /**
     * Get the protected controller service.
     * @returns {ControllerService}
     */
    get controllers() {
        return this._controllers;
    }

    /**
     * Get the protected services collection.
     * @returns {ObjectCollection}
     */
    get services() {
        return this._services;
    }

    /**
     * Get the protected providers service.
     * @returns {ProviderService}
     */
    get providers() {
        return this._providers;
    }

    /**
     * Get the protected extension service.
     * @returns {ExtensionService}
     */
    get extensions() {
        return this._extensions;
    }
    /**
     * Get the protected models service.
     * @returns {ModelService}
     */
    get models() {
        return this._models;
    }
    /**
     * Get the protected alias collection.
     * @returns {ObjectCollection}
     */
    get aliases() {
        return this._aliases;
    }

    /**
     * Get the expressway version.
     * @returns {String}
     */
    get version() {
        return this._package.version;
    }

    /**
     * Check if this application instance is booted.
     * @returns {Boolean}
     */
    get booted() {
        return this._booted;
    }

    /**
     * Load a module with the Application as a dependency and also inject services into it.
     * A module should be a function with the first argument being the Application instance.
     * @public
     * @param module string|function
     * @param args Array
     * @returns {*}
     */
    load(module,args=[])
    {
        let fn = typeof module == 'string' ? require(module) : module;
        return this.call(fn,[this].concat(args));
    }

    /**
     * Get or set a service.
     * @public
     * @param name {String|Function}
     * @param service *
     * @throws {TypeError}
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
     * @public
     * @param serviceNames {String}
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
     * @public
     * @param fn {Function}|{Array}
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

            COLLECTIONS.forEach(propertyName => {
                if (value && value instanceof (this[propertyName].class)) {
                    this[propertyName].add(value.name, value);
                }
            });
        } catch (err) {

            // When adding classes via app.use(), we're going to let it slide if the objects exist.
            // We're assuming an extension or provider already included the objects.
            let isObjectExistError = err instanceof ObjectExistsException
                || (err instanceof ApplicationCallError && err.thrown instanceof ObjectExistsException);

            if (! isObjectExistError) throw err;
        }

        return this;
    }

    /**
     * Get or set an alias.
     * @public
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
     * @public
     * @param params
     * @throws TypeError|ApplicationCallError
     * @returns {*}
     */
    call(...params)
    {
        let [context,method,args] = getAppCallParameters(params);

        if (! context) throw new TypeError('context must be object with a method name or function');

        // This is a method on an object.
        // example: app.call(object, 'methodName')
        if (method)
        {
            if (typeof context !== 'object')
                throw new ApplicationCallError(new TypeError(`context must be an object if method name given`),context,method);
            if (typeof context[method] !== 'function')
                throw new ApplicationCallError(new TypeError(`context method must be a function`),context,method);

            try {
                // Return the context method function injected with services.
                return context[method].apply(context, this.inject(context[method], args));
            } catch (err) {
                throw new ApplicationCallError(err,context,method);
            }
        }

        // After this point, the context must be a function.
        // example: app.call(function(...))
        if (typeof context !== 'function') {
            throw new ApplicationCallError(new TypeError(`context must be a function`),context,method);
        }

        try {
            // This is a class or constructor function.
            // This is difficult to detect, hence the function $constructor property.
            if (checkIfClassConstructor(context)) {
                let services = this.inject(context.prototype.constructor, args);
                return new context(...services);
            }

            // This is just a regular function.
            return context.apply(context, this.inject(context, args));

        } catch(err) {
            throw new ApplicationCallError(err,context,method);
        }
    }

    /**
     * Wrap an app.call() function with a function.
     * Useful for passing injectable functions to event listeners.
     * @example
     * ```javascript
     * function myFunction(arg1,arg2,injected) {...}
     *
     * app.on('boot', app.callFn(myFunction));
     * app.emit('boot', arg1, arg2)
     * ```
     * @public
     * @param fn Function
     * @throws TypeError
     * @returns {function(this:Application)}
     */
    callFn(fn)
    {
        if (typeof fn !== 'function') {
            throw new TypeError('argument must be a function');
        }
        fn.$constructor = false;
        return function(...args) {
            return this.call(fn,null,args);
        }.bind(this);
    }

    /**
     * Given a function with arguments,
     * find the services matching the argument names.
     * @public
     * @param fn Function
     * @param padding Array
     * @returns {Array}
     */
    inject(fn,padding=[])
    {
        let serviceNames = utils.annotate(fn);

        return serviceNames.map((serviceName,index) =>
        {
            if (padding.length > index) return padding[index];
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
     * Objects are booted in this order: models, providers, extensions
     * @public
     * @returns {Promise}
     */
    boot()
    {
        if (this._booted) return Promise.resolve();

        return new Promise((resolve,reject) =>
        {
            this.models.boot().then(() => {
                return this.providers.boot();

            }).then(() => {
                return this.extensions.boot();

            }).then(() => {
                this._booted = true;
                this.emit('booted');
                return resolve();

            }).catch(err => {
                return reject(err);
            });
        });
    }

    /**
     * Start the express server.
     * Uses the base extension.
     * @returns void
     */
    start()
    {
        this.boot().then(() =>
        {
            let [log,url] = this.get('log','url');

            this.root.express.listen(this.config.port, () =>
            {
                log.info('using root path: %s', this.rootPath);
                log.info(`starting %s server v.%s on %s`,
                    this.env,
                    this.version,
                    url.get()
                );
                log.info('loaded in %s', this._clock.lap());

                this.emit('started');
            });
        });
    }
}

/**
 * Function for returning the proper arguments to app.call().
 * @param params {Array}
 * @returns {[*,*,*]}
 * @private
 */
function getAppCallParameters(params)
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

    return [context,method,args];
}

/**
 * Checks if the given function is a class constructor.
 * Note, only works with functions created with 'class'.
 * @param fn {Function}
 * @returns {boolean}
 * @private
 */
function checkIfClassConstructor(fn)
{
    if (typeof fn.$constructor !== 'undefined') {
        return fn.$constructor;
    }
    // Test the reflection of the function.
    return fn.$constructor = /^\s*class\s+/.test( fn.toString() );
}

/**
 * Create some basic services, such as app, config and debug.
 * @param app {Application}
 * @returns void
 * @private
 */
function createBaseServices(app)
{
    let config = utils.objectAccessor(app.config);

    app.service('utils',  utils);
    app.service('config', config);

    // Logger and debug function are configurable.
    app.service('log', app.config.logger
        ? app.load(app.config.logger)
        : app.load('./services/LogService'));

    app.service('debug', app.config.debugger
        ? app.load(app.config.debugger)
        : app.get('log').debug);

    let URLService = app.load('./services/URLService');
    let urlBase = _.trimEnd(config('proxy', `${config('url')}:${config('port')}`), "/");

    app.service('paths',  app.load('./services/PathService'));
    app.service('url',    new URLService(urlBase));
    app.service('URLService', URLService);
    app.service('locale', app.load('./services/LocaleService'));

    app.emit('setup');
}

/**
 * Initial application setup.
 * @injectable
 * @param app {Application}
 * @param config {Function}
 * @param paths {PathService}
 * @returns void
 * @private
 */
function applicationInit(app,config,paths)
{
    paths.add('root', app.rootPath);
    _.each(config('paths', []), (value,key) => {
        if (value.startsWith(".")) value = value.splice(0,1,app.rootPath);
        paths.add(key,value);
    });

    // The CLI Provider is a common package.
    app.use(require('./providers/CLIProvider'));

    // Create a base extension to add routes.
    app.extensions.add('root', config('root', require('./support/DefaultRootExtension')));
}

module.exports = Application;