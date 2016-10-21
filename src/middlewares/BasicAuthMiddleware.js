"use strict";

var Expressway = require('expressway');

class BasicAuthMiddleware extends Expressway.Middleware
{
    boot(express,auth)
    {
        auth.passport.use(auth.strategy);
        express.use(auth.passport.initialize());
        express.use(auth.passport.session());
    }

}

module.exports = BasicAuthMiddleware;

