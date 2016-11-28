"use strict";

var path         = require('path');
var EventEmitter = require('events');
var Provider     = require('./Provider');
var Module       = require('./Module');
var utils        = require('./support/utils');


/**
 * The application class sets up the entire stack.
 * @constructor
 */
class Application extends EventEmitter
{
    /**
     * Constructor.
     * @param expressway Expressway
     * @param config object
     * @param context string web|cli|test
     * @returns Application
     */
    constructor(expressway, config, context=CXT_WEB)
    {
        super();

        var conf = utils.objectAccessor(config);

        this.setMaxListeners(conf('max_listeners',50));

        this._expressway    = expressway;
        this._booted        = false;
        this._package       = require(__dirname+'/../package.json');
        this._order         = [];
        this._config        = config;
        this._providers     = {};
        this._services      = {};
        this._modules       = {};
        this._aliases       = {};
        this._env           = config.environment;
        this._context       = context;

        this.register('package', this._package,
            "The NPM package.json");

        this.register('app', this,
            "The Application instance");

        this.register('config', conf,
            "Helper function for accessing the config file");

        this._createProviderInstances(config.providers);
    }

    /**
     * Get the Expressway version.
     * @returns {string}
     */
    get version() {
        return this._package.version;
    }

    get config() {
        return this._config;
    }

    get env() {
        return this._env;
    }

    get context() {
        return this._context;
    }

    get providers() {
        return this._providers;
    }

    get services() {
        return this._services;
    }

    get modules()
    {
        return this._modules;
    }

    /**
     * Get or set an alias.
     * @param key string
     * @param value string
     * @returns {*}
     */
    alias(key,value)
    {
        if (arguments.length == 1) {
            return this._aliases[key];
        }
        if (typeof value != 'string') {
            throw new TypeError("2nd argument must be a string");
        }
        this._aliases[key] = value;
    }

    /**
     * Create and index the provider instances.
     * @param providers Array<Provider|Array>
     * @private
     */
    _createProviderInstances(providers)
    {
        providers.forEach( ProviderClass =>
        {
            if (Array.isArray(ProviderClass)) {
                return this._createProviderInstances(ProviderClass);
            }

            try {
                var providerInstance = new ProviderClass(this);
            } catch (err) {
                throw new ApplicationError("Error loading provider: "+err.message, ProviderClass);
            }

            if (providerInstance instanceof Module) {
                this._modules[providerInstance.name] = providerInstance;
            }

            // Add to the providers index.
            return this._providers[providerInstance.name] = providerInstance;
        });
    }

    /**
     * Initial setup of the server.
     * @returns Application
     */
    bootstrap()
    {
        if (this._booted) return this;

        // Sort the providers by their load order and
        // call the register method on each.
        var providers = Object.values(this._providers).sort(utils.sortByDirection(1,'_order'));

        providers.forEach(provider => { this.load(provider) });

        this.emit('providers.registered');

        // Boot all providers in order.
        this._order.forEach( provider => { this.boot(provider) });

        this._booted = true;

        this.emit('application.booted');

        return this;
    }

    /**
     * Call the register() method on the given provider, and register any dependencies.
     * @param provider Provider
     * @returns {boolean}
     */
    load(provider)
    {
        if (! provider.isLoadable(this.env, this.context) || provider.loaded()) return false;

        provider.attachEvents(this);

        this.emit('provider.loading', provider);

        // Load any dependencies first.
        provider.requires().forEach( dependencyName =>
        {
            var dependency = this._providers[dependencyName];

            if (! dependency) {
                throw new ApplicationLoadError(`Provider is missing a dependency`, provider, dependencyName);
            }
            if (! dependency.active()) {
                throw new ApplicationLoadError(`Dependency is not active`, provider,dependency);
            }
            if (dependency.requires().indexOf(provider.name) > -1) {
                throw new ApplicationLoadError(`Providers cannot declare each other as dependencies`, provider, dependency);
            }
            this.load(dependency);
        });

        this.call(provider, "register");

        provider.loaded(true);

        this._order.push(provider);

        this.emit('provider.loaded', provider);

        return true;
    }

    /**
     * Check if the given provider name is loaded.
     * @param providerName string
     * @returns {boolean}
     */
    loaded(providerName)
    {
        if (! this._providers.hasOwnProperty(providerName)) {
            return false;
        }
        return this._providers[providerName].loaded();
    }

    /**
     * Call the boot() method on the given provider and inject any services.
     * @param provider Provider
     * @returns {boolean}
     */
    boot(provider)
    {
        if (! provider.loaded() || provider.booted()) return false;

        this.call(provider,'boot');

        provider.booted(true);

        this.emit('provider.booted', provider);

        return true;
    }


    /**
     * Start the application server.
     * @param listening function, optional
     * @returns Application
     */
    server(listening)
    {
        this.emit('application.server', this);

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
    register(serviceName, instance, description, call=false)
    {
        if (typeof serviceName == 'object') {
            instance = serviceName;
            serviceName = serviceName.name;
            description = instance.description || `${serviceName} instance`;
        }
        if (this.has(serviceName)) {
            throw new Error (`"${serviceName}" service has already been defined`);
        }

        this._services[serviceName] = {
            call:  call && typeof instance === 'function',
            value: instance,
            doc:   description,
        };

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

        try {
            if (typeof context === 'function')
            {
                if (context.constructor) {
                    let services = this.injectServices(context.prototype.constructor, args);
                    return new context(...services);
                }
                return context.apply(context, this.injectServices(context, args));

            } else if (typeof context === 'object' && typeof method === 'string' && typeof context[method] === 'function') {
                return context[method].apply(context, this.injectServices(context[method], args));
            }

        } catch (err) {
            throw new ApplicationCallError(err.message + ` ${context.name}.${method}`);
        }

        throw new ApplicationCallError(`Context must be a function or object: ${context.name}.${method}`);
    }

    /**
     * Given the array of string service/provider names,
     * resolve the registered objects.
     * @param array
     * @param args array
     * @returns {Array}
     */
    getServices(array,args=[])
    {
        if (! Array.isArray(array)) array = [];

        return array.map((serviceName,i) =>
        {
            if (args[i]) return args[i];

            if (! this.has(serviceName)) {
                throw new Error(`Service does not exist: ${serviceName} in [${array.join(",")}]`);
            }

            var service = this.services[serviceName];

            return service.call ? this.call(service.value) : service.value;
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
        return this._services.hasOwnProperty(service);
    }

    /**
     * Return a human readable list of route stacks for each application.
     * @returns {Array}
     */
    stacks(moduleName)
    {
        if (moduleName) {
            return utils.getMiddlewareStack(this.modules[moduleName].express);
        }

        return Object.keys(this.modules).map((key,i) => {
            let provider = this.modules[key];
            return {
                index: i,
                name: key,
                stack: utils.getMiddlewareStack(provider.express)
            }
        });
    }
}



module.exports = Application;