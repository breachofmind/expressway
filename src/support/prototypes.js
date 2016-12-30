"use strict";

var http  = require('http');
var Promise = require('bluebird');
var View = require('../View');

/**
 * The splice() method changes the content of a string by removing a range of
 * characters and/or adding new characters.
 *
 * @this {String}
 * @param {number} start Index at which to start changing the string.
 * @param {number} delCount An integer indicating the number of old chars to remove.
 * @param {string} newSubStr The String that is spliced in.
 * @return {string} A new string with the spliced substring.
 */
String.prototype.splice = function(start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

/**
 * Specifies that the given function is not a constructor and is callable.
 * @returns {Function}
 */
Function.prototype.callable = function()
{
    this.$call = true;
    this.$constructor = false;

    return this;
}

/**
 * Return a query string value or the default value.
 * @param property string
 * @param defaultValue optional
 * @returns {string}
 */
http.IncomingMessage.prototype.getQuery = function(property,defaultValue)
{
    if (this.query && this.query.hasOwnProperty(property)) {
        return this.query[property];
    }
    return defaultValue;
};


/**
 * Determine the phrase to use for the status code.
 * @returns {string}
 */
http.ServerResponse.prototype.phrase = function()
{
    return http.STATUS_CODES[this.statusCode];
};

/**
 * Returns all the info about the request and current response state.
 * @returns {{ip: *, method: string, status, phrase: *, route: (*|string), url: *, user: null}}
 */
http.ServerResponse.prototype.info = function()
{
    return {
        ip: this.req.ip,
        method: this.req.method,
        status: this.statusCode,
        phrase: this.phrase(),
        route: this.$route,
        url: this.req.originalUrl,
        user: this.req.user ? this.req.user.id : null
    };
};

/**
 * Return a smart response, based on the given value.
 * @param value mixed
 * @param status {Number}
 * @returns {*}
 */
http.ServerResponse.prototype.smart = function(value,status)
{
    // Headers were sent already or being handled differently.
    if (this.headersSent || value === true || typeof value === 'undefined') {
        return null;
    }

    if (status) this.status(status);

    if (value === false || value === null || typeof value === 'number') {
        // Does not exist or is a number.
        return this.sendStatus(! value ? 404 : value);

    } else if (value instanceof Promise) {
        // Execute the promise, and then recursively try again.
        return value.then(returnValue => { return this.smart(returnValue) });

    } else if (value instanceof View) {
        // Render the View object.
        return value.render();

    } else if (typeof value == "object") {
        // Convert objects to JSON and return JSON response.
        return this.json(typeof value.toJSON === 'function' ? value.toJSON() : value);
    }

    // Value is string.
    return this.send(value);
};

/**
 * Send a response formatted for the API.
 * @param data mixed
 * @param status Number
 * @param metadata object, optional
 */
http.ServerResponse.prototype.api = function(data,status,metadata)
{
    this.status(status);

    var response = {
        statusCode: this.statusCode,
        message: this.phrase(),
        method: this.req.method,
        user: this.req.user ?  this.req.user.id : null
    };
    if (metadata) {
        for (var prop in metadata) {
            if (metadata.hasOwnProperty(prop)) {
                response[prop] = metadata[prop];
            }
        }
    }
    response[status == 200 ? 'data' : 'error'] = data;

    return this.smart(response,status);
};

/**
 * If using flash middleware, redirect with a flash message.
 * @param to string
 * @param key string
 * @param body object
 * @returns {*}
 */
http.ServerResponse.prototype.redirectWithFlash = function(to,key,body)
{
    if (this.ajax) {
        return this.smart(body);
    }
    this.req.flash(key, body);

    return this.redirect(to);
};