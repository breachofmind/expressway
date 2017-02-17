"use strict";

var Middleware = require('../Middleware');
var connectFlash = require('connect-flash');

class Flash extends Middleware
{
    get description() {
        return "Provides session-based Flash messaging via connect-flash";
    }

    constructor(app)
    {
        super(app);

        app.service('flash',flash);
    }

    dispatch(extension)
    {
        var middleware = connectFlash();
        return function Flash(...args)
        {
            return middleware(...args);
        }
    }
}

function flash(request,response,next) {
    let message = request.flash('message');
    return message.length ? message[0] : null;
}
flash.$call = true;
flash.$constructor = false;

module.exports = Flash;

