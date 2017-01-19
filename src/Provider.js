"use strict";

var assert = require('assert');
var utils  = require('./support/utils');
var _      = require('lodash');

/**
 * Provider class.
 * For adding or modifying functionality to the application.
 * @constructor
 */
class Provider
{
    /**
     * Create an instance of a provider.
     * @param app Application
     */
    constructor(app)
    {
        /**
         * The protected application instance.
         * @type {Application}
         * @private
         */
        this._app = app;

        /**
         * The order that this provider will boot.
         * @type {number}
         * @private
         */
        this._order = 10;

        /**
         * The environments this provider will boot in.
         * @type {Array}
         * @private
         */
        this._environments = ENV_ALL;

        /**
         * The contexts this provider will boot in.
         * @type {Array}
         * @private
         */
        this._contexts = CXT_ALL;

        /**
         * Is this provider booted?
         * @type {boolean}
         * @private
         */
        this._booted = false;
    }

    /**
     * Get the name of the provider.
     * @returns {String}
     */
    get name() {
        return this.constructor.name;
    }

    /**
     * Get the Application instance.
     * @returns {Application}
     */
    get app() {
        return this._app;
    }

    /**
     * Get the boot order.
     * @returns {Number}
     */
    get order() {
        return this._order;
    }

    /**
     * Set the boot order.
     * @param n {Number}
     */
    set order(n) {
        assert.equal(typeof n, 'number');
        this._order = n;
    }

    /**
     * Get the environments.
     * @returns {Array}
     */
    get environments() {
        return this._environments;
    }

    /**
     * Set the environments.
     * @param arr {Array}
     */
    set environments(arr) {
        this._environments = utils.castToArray(arr);
    }

    /**
     * Get the environments.
     * @returns {Array}
     */
    get contexts() {
        return this._contexts;
    }

    /**
     * Set the environments.
     * @param arr {Array}
     */
    set contexts(arr) {
        this._contexts = utils.castToArray(arr);
    }

    /**
     * Check if this provider has been booted.
     * @returns {*|boolean}
     */
    get booted() {
        return this._booted;
    }

    /**
     * Called when all providers have been registered.
     * @param done Function
     */
    boot(done)
    {
        return done();
    }

    /**
     * Check if this provider can be loaded.
     * @param env {string}
     * @param context {string}
     * @returns {boolean}
     */
    isLoadable(env, context)
    {
        var inEnvironment = this._environments.indexOf(env) > -1;
        var inContext =  this._contexts.indexOf(context) > -1;

        return inEnvironment && inContext;
    }

    /**
     * Return a native value of the object.
     * @returns {String}
     */
    toValue()
    {
        return this.name;
    }

    /**
     * Return this object as a string.
     * @returns {String}
     */
    toString()
    {
        return this.name;
    }
}

module.exports = Provider;