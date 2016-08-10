# Express MVC Sample Application

This directory contains the basic file structure you'll need in your application.

## Directory Structure

- `config` - Configuration, environment and routes.
- `controllers` - Controller definitions.
- `db` - Database seeder and seed files.
- `lang` - Application locale files, organized by locale name.
- `logs` - Your application log files.
- `models` - Model definitions.
- `providers` - Application business logic and/or extensions.
- `resources` - Location of the application front-end files and views.

## Configuration

Inside `config`, there should be these files:

- `config.js` - Global configuration for the application.
- `env.js` - Environment configuration for the application. Be sure to add to your `.gitignore`.
- `routes` - Your application routes.

## Routing

Routes are handled in a simplified way. Using a controller: (controllerName.controllerMethod)

```javascript
this.get({
    '/url' : 'indexController.index',
});
```

Or, the old-fashioned way:

```javascript
this.get({
    '/url' : function(request,response,next) { ... },
});
```

## Route Middleware

Adding middleware to controller routes can be done via the controller setup method:

```javascript
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