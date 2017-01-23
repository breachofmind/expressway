"use strict";

var Extension = require('../Extension');

class DefaultRootExtension extends Extension
{
    constructor(app,paths)
    {
        super(app);

        app.use([
            require('expressway/src/middlewares'),
        ]);

        this.routes.middleware([
            'Static',
            'Init',
            'ConsoleLogging',
            'BodyParser',
            'Ajax'
        ]);

        this.routes.static("/", paths.public());

        this.express.set('views', paths.views());
        this.express.set('view engine', 'ejs');
    }
}

module.exports = DefaultRootExtension;