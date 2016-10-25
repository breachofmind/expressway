"use strict";

var path     = require('path');
var events   = require('events');
var Provider = require('./Provider');
var utils    = require('./support/utils');


/**
 * The application class sets up the entire stack.
 * @constructor
 */
class Application
{
    /**
     * Constructor.
     * @param expressway Expressway
     * @returns Application
     */
    constructor(expressway)
    {
        this._expressway    = expressway;
        this._booted        = false;
        this._package       = require(__dirname+'/../package.json');
        this._version       = this._package.version;
        this._order         = [];

        this.providers     = {};
        this.services      = {};
        this.documentation = {};

        this.config = expressway.config;
        var config = utils.objectAccessor(this.config);
        this.env = expressway.env;
        this.context = expressway.context;
        this.event = new events.EventEmitter();
        this.event.setMaxListeners(config('max_listeners',50));

        this.register('package', this._package, "The NPM package.json");
        this.register('app', this, "The Application instance");
        this.register('event', this.event, "Application event emitter instance");
        this.register('config', config, "Helper function for accessing the config file");
    }


    /**
     * Initial setup of the server.
     * @param providers array, optional
     * @returns Application
     */
    bootstrap(providers)
    {
        if (this._booted) return this;

        if (! providers) providers = this.config.providers;

        // Instantiate and index all providers first.
        var objects = providers.map( ProviderClass => {
            try {
                var instance = new ProviderClass(this);
                this.providers[instance.name] = instance;
                this.event.emit(instance.name+".construct", instance);
            } catch (e) {
                throw new ApplicationError("Error loading provider", ProviderClass);
            }

            return instance;

        }).sort(function ascending(a,b) {
            return a.order == b.order ? 0 : (a.order > b.order ? 1: -1);
        });

        // Register all providers and their dependencies.
        objects.forEach( provider => { this.load(provider) });

        this.event.emit('providers.registered', this);

        // Boot all providers.
        this._order.forEach( provider => { this.boot(provider) });

        this._booted = true;

        return this;
    }

    /**
     * Call the register() method on the given provider, and register any dependencies.
     * @param provider Provider
     * @returns {boolean}
     */
    load(provider)
    {
        if (! provider.isLoadable(this.env, this.context) || provider.loaded) return false;

        this.event.emit('provider.loading', provider);

        // Load any dependencies first.
        provider.requires.forEach( dependencyName =>
        {
            var dependency = this.providers[dependencyName];

            if (! dependency) {
                throw (`Provider ${provider.name} is missing a dependency: ${dependencyName}`);
            }
            if (! dependency.active) {
                throw (`Provider ${provider.name} dependency needs to be active: ${dependency.name}`);
            }
            this.load(dependency);

        });

        this.call(provider,"register");

        this._order.push(provider);

        provider.loaded = true;

        this.event.emit('provider.loaded', provider);

        return true;
    }

    /**
     * Call the boot() method on the given provider and inject any services.
     * @param provider Provider
     * @returns {boolean}
     */
    boot(provider)
    {
        if (! provider.loaded || provider.booted) return false;

        this.call(provider,'boot');

        provider.booted = true;

        this.event.emit('provider.booted', provider);

        return true;
    }


    /**
     * Start the application server.
     * @param listening function, optional
     * @returns Application
     */
    server(listening)
    {
        this.event.emit('application.server', this);

        if (typeof listening == 'function') this.call(listening);

        return this;
    };

    /**
     * Return a path relative to the root path.
     * @param filePath string
     * @returns {string}
     */
    rootPath(filePath)
    {
        return this._expressway.rootPath(filePath);

    }

    /**
     * Return a path relative to the rootPath.
     * @param conf string key from the config, ie resources_path
     * @param defaultPath string
     * @returns {string}
     */
    path(conf,defaultPath)
    {
        var config = this.get('config');
        return this.rootPath( config(conf,defaultPath) ) + "/";
    }


    /**
     * Register a service or other object.
     * @param serviceName {string}
     * @param instance mixed
     * @param description {string} optional
     * @param call {bool} when injecting a function, do an app.call() first?
     * @returns {Application}
     */
    register(serviceName, instance, description, call)
    {
        if (this.has(serviceName)) {
            throw new Error (`"${serviceName}" service has already been defined`);
        }
        if (call === true && typeof instance == 'function') instance.$call = true;
        this.services[serviceName] = instance;
        if (description) {
            this.documentation[serviceName] = description;
        }
        return this;
    }

    /**
     * Register a Class singleton.
     * @param name string
     * @param Class string|Function
     * @param description string
     * @returns {Application}
     */
    singleton(name,Class,description)
    {
        if (typeof Class === 'string') Class = require(Class);
        return this.register(name,new Class,description);
    }

    /**
     * Call a method or function with the services injected.
     * The function arguments should be the service names.
     * Example: this.register(db,Models)
     * @param context object|function
     * @param method string
     * @param args Array - optional arguments
     * @throws Error
     * @returns {*}
     */
    call(context,method,args)
    {
        if (! context) throw new ApplicationCallError("Missing context");

        if (typeof context === 'function')
        {
            if (context.constructor) {
                var svc = this.injectServices(context.prototype.constructor, args);
                return new context(...svc);
            }
            return context.apply(context, this.injectServices(context, args));

        } else if (typeof context === 'object' && typeof method === 'string' && typeof context[method] === 'function') {
            return context[method].apply(context, this.injectServices(context[method], args));
        }

        throw new ApplicationCallError("Context must be a function or object");
    }

    /**
     * Given the array of string service/provider names,
     * resolve the registered objects.
     * @param array
     * @param args array
     * @returns {Array}
     */
    getServices(array,args)
    {
        if (! args) args = [];
        if (! Array.isArray(array)) array = [];

        return array.map((serviceName,i) =>
        {
            if (args[i]) return args[i];

            if (! this.has(serviceName)) {
                throw new Error(`Service does not exist: ${serviceName}`);
            }

            var service = this.services[serviceName];

            if (typeof service === 'function' && service.$call) {

                return this.call(service);
            }
            return service;
        })
    }

    /**
     * Inject services into a function.
     * @param fn function
     * @param args array
     * @returns {Array}
     */
    injectServices(fn,args)
    {
        return this.getServices(utils.annotate(fn),args);
    }

    /**
     * Get a provider or class instance by name.
     * Can also pass multiple arguments to return an array of services.
     * @param services string
     * @returns {Provider|object|null}
     */
    get(...services)
    {
        var objects = this.getServices(services);
        return objects.length === 1 ? objects[0] : objects;
    }

    /**
     * Check if a service is loaded.
     * @param service name
     * @returns {boolean}
     */
    has(service)
    {
        return this.services.hasOwnProperty(service);
    }

    /**
     * Get the Expressway version.
     * @returns {string}
     */
    get version()
    {
        return this._version;
    }
}



module.exports = Application;