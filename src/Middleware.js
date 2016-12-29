"use strict";

class Middleware
{
    constructor(app)
    {
        /**
         * Application instance.
         * @type Application
         */
        this.app = app;
    }

    /**
     * Return the name of the middleware.
     * @returns {String}
     */
    get name()
    {
        return this.constructor.name;
    }

    /**
     * The method to return to express.
     * This function can have services injected in it.
     * @param request
     * @param response
     * @param next
     */
    method(request,response,next)
    {
        throw new Error(`unimplemented: ${this.name}.method()`);
    }

    /**
     * Register the middleware with express.
     * Should return a function that express can use:
     * function(request,response,next) {...}
     * @param extension Extension
     * @returns {Function}
     */
    dispatch(extension)
    {
        let self = this;

        function middleware(request,response,next)
        {
            if (response.headersSent) return null;

            response.$route = self.name;

            let val = self.app.call(self,'method', [request,response,next]);

            if (val) return response.smart(val);
        }

        middleware.$name = this.name;

        return middleware;
    }

    /**
     * Create a middleware instance out of anonymous function.
     * @param fn Function
     * @returns {AnonymousMiddleware}
     */
    static create(fn)
    {
        if (typeof fn !== 'function') {
            throw new TypeError('argument must be a function');
        }
        fn.$constructor = false;

        class AnonymousMiddleware extends Middleware
        {
            dispatch(extension)
            {
                let self = this;
                let name = fn.name || 'anonymous';


                function middleware (request,response,next)
                {
                    response.$route = name;
                    return self.app.call(fn,[request,response,next]);
                }

                middleware.$name = name;

                return middleware;
            }
        }

        return AnonymousMiddleware;
    }
}

module.exports = Middleware;