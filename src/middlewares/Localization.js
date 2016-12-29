"use strict";

var Middleware  = require('expressway').Middleware;
var Locale      = require('locale');
var http        = require('http');

class Localization extends Middleware
{
    get description() {
        return "Finds the requester's locale and adds some localization functionality";
    }

    dispatch(extension,locale,config)
    {
        var middleware = Locale( config('lang_support', ['en_us']));

        return [

            // Sets the request.locale property.
            function LocaleParser()
            {
                return middleware(...arguments);
            },

            // Checks the query string for a locale property.
            // Binds some helper functions to the request and view.
            function LocaleQuery(request,response,next)
            {
                if (request.query.cc) {
                    request.locale = request.query.cc.toLowerCase();
                }
                // Bind a helper function to the request.
                request.lang = locale.helper(request);

                // Bind a helper function to the view object.
                response.view.use('lang', request.lang);

                next();
            }
        ]
    }
}

module.exports = Localization;

