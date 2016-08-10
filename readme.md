# Express MVC v.0.5.0 (In development)

This is just a handy little starter framework. Includes:

- Express.js webserver
- MongoDB Database and mongoose ORM
- Controllers and parameter binding
- Controller-wide and route Middleware
- Smart response rendering (objects render as JSON)
- CRUD API and JSON response (if you want it!)
- Range-based pagination in JSON API
- User authentication and session storage
- EJS templates, but ability to override with your own templating library
- CSV to JSON database seeding
- CLI utility for custom actions
- Locale support
- Extension-ready using providers

## Configuration

See `/app` for a sample directory structure.

Inside `/app/config`, there should be these files:

- `config.js` - Global configuration for the application.
- `env.js` - Environment configuration for the application. Be sure to add to your `.gitignore`.
- `routes.js` - Your application routes.

## Running the Application

This micro-framework was designed to be super easy to set up. Just require the object in your `index.js` entry point and initialize with your application's root directory.

```javascript

var ExpressMVC = require('express-mvc');
 
var app = ExpressMVC.init(__dirname+"/app/");
 
app.server();
 
```

## Using Default Controllers

This framework comes with a couple standard controllers you can use.

- `ControllerFactory.basic.REST` - A basic REST API for your application.
- `ControllerFactory.basic.Locales` - A place to retrieve your language resources, if building a rich web app.

To use any of these, create a new controller...

```javascript
// controllers/restController.js
module.exports = function(Factory)
{
    return Factory.create('restController', Factory.basic.REST);
};

```

And create your routes, or use the default ones...

```javascript
// config/routes.js
module.exports = function(app,Template)
{
    app.ControllerFactory.basic.Locales.routes(this);
    app.ControllerFactory.basic.REST.routes(this);
}

```


## Routing

Routes are handled in a simplified way. Using a controller: (controllerName.controllerMethod)

```javascript
// config/routes.js
module.exports = function(app,Template)
{
    this.get({
        '/url' : 'indexController.index',
    });
}

```

Or, the old-fashioned way:

```javascript
module.exports = function(app,Template)
{
    this.get({
        '/url' : function(request,response,next) { ... },
    });
}

```

## Route Middleware

Adding middleware to controller routes can be done via the controller setup method:

```javascript
// controllers/authController.js
module.exports = function(Factory)
{
    return Factory.create('authController', function(app)
    {
        // Assign middleware to a controller method.
        this.middleware({
            update : apiAuthMiddleware,
            create : apiAuthMiddleware,
            trash  : apiAuthMiddleware
        });
                    
        // Assign middleware to all controller methods.
        this.middleware(modelMiddleware);
    }
}
```



### CLI Utility

`/bin/mvc` is a sample utility that shows how to add custom actions to the application. 


### Locale support

To use locales, create the `/app/lang` directory. Inside this directory, create sub-directories with the locale namespace, i.e. `en_us`.

You can separate your key/value pairs using .js files. For instance, creating an `index.js` file in `/app/lang/en_us`:

```javascript
module.exports = {
  myKey: "Welcome, {$0} {$1}"
  anotherKey: "Another Value!"
}
```

In your markup, use the `lang()` method. The passed parameters are filled in:

```
h1=lang("myKey", ["Johnny", "Rico"])

p=lang("anotherKey")
```

