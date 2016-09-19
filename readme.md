# Expressway v.0.5.0 (In development)

This is just a handy little starter framework. Includes:

- Express.js webserver
- MongoDB Database and mongoose ORM
- Controllers and parameter binding
- Controller-wide and route Middleware
- Smart response rendering (objects render as JSON)
- CRUD API and JSON response (if you want it!)
- Range-based pagination in JSON API
- User authentication and session storage
- Fully customizable provider modules
- CSV to JSON database seeding
- CLI utility for custom actions
- Locale support
- Extension friendly

## Configuration

See `/demo` for a sample directory structure.

Inside `/demo/config`, there should be these files:

- `config.js` - Global configuration for the application.
- `env.js` - Environment configuration for the application. Be sure to add to your `.gitignore`.
- `routes.js` - Your application routes.

## Running the Application

This micro-framework was designed to be super easy to set up. Just require the object in your `index.js` entry point and initialize with your application's root directory.

```javascript

var expressway = require('expressway');
 
var app = expressway.init(__dirname+"/app/");
 
app.server();
 
```

## Providers

This framework is heavily inspired by Taylor Otwell's [Laravel 5](https://github.com/laravel/laravel) for PHP. __Providers__ are modules that provide most of the framework's functionality.

They can have dependencies, which makes them good as extensions. Or, they can be swapped out entirely to be replaced by your own implementation.

They can also be turned on or off, on an environment basis if need be.

Providers have a specific format:

```javascript
var expressway = require('expressway');

class myProvider extends expressway.Provider
{
    constructor()
    {
        // Pass the provider name to the base class.
        super("myProvider");
        
        // Change the load order.
        this.order = 0;
        
        // Required dependencies.
        this.requires([
            'logger',
            'express'
        ]);
        
        // Choose which environments this provider is allowed to run in.
        // ENV_CLI|ENV_LOCAL|ENV_DEV|ENV_PROD
        this.inside([ENV_CLI]);
        
        // Add configurations to the provider instance.
        this.customConfig = {};
    }
    
    register(app)
    {
        // This parts runs during the application's bootstrap.
        
        // Attach stuff to the application instance.
        app.MyClass = function(){}
        
        // Attach stuff to the expressway class.
        expressway.ClassInstance = {};
        
        // Add events. This one will add data to all views.
        app.event.on('view.created', function(view){
            view.data.message = "Hello World"
        })
        
        // This runs when the server starts.
        app.event.on('application.server', function(app){
            console.log('My provider is working');
        })
    }
}

// Export the provider definition.
module.exports = new myProvider();
}
```

## Using Default Controllers

This framework comes with a couple standard controllers you can use.

- `REST` - A basic REST API for your application.
- `Locales` - A place to retrieve your language resources, if building a rich web app.

To use any of these, create a new controller and use the configuration from the provider...

```javascript
// controllers/restController.js
var expressway = require('expressway');
var defaults = expressway.Provider.get('controllerDefaults');

// Optional: add middleware to the routes.
defaults.REST.middleware = {
    index: function(request,response,next){
        console.log("Welcome!");
        next();
    }
}
module.exports = expressway.Controller.create('restController', defaults.REST.controller);

```

And create your routes, or use the default ones using the same method above...

```javascript
// config/routes.js
module.exports = function(app)
{
    var defaults = app.get('controllerDefaults');
    
    // Add the routes to your router.
    defaults.REST.routes(this);
    defaults.Locales.routes(this);
}

```


## Routing

Routes are handled in a simplified way. Using a controller: (controllerName.controllerMethod)

```javascript
// config/routes.js
module.exports = function(app)
{
    this.get({
        '/url'     : 'indexController.index',
        '/url/:id' : 'indexController.show',
    });
}

```

Or, the old-fashioned way:

```javascript
module.exports = function(app)
{
    this.get({
        '/url' : function(request,response,next) { ... },
    });
}

```

## Route Middleware

Adding middleware to controller routes can be done via the controller setup method:

```javascript
// controllers/indexController.js
var expressway = require('expressway');

module.exports = expressway.Controller.create('indexController', function(app)
{
    // Assign middleware to a controller method.
    this.middleware({
        update : apiAuthMiddleware,
        create : apiAuthMiddleware,
        trash  : apiAuthMiddleware
    });
                
    // Assign middleware to all controller methods.
    this.middleware(modelMiddleware);

    return {...}
    }
});
```


### Locale support

To use locales, create the `/resources/lang` directory (or provide your own directory from the `config.js` file). Inside this directory, create sub-directories with the locale namespace, i.e. `en_us`.

You can separate your key/value pairs using .js files. For instance, creating an `index.js` file in `/resources/lang/en_us`:

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

### Seeder

Seeding a MongoDB database can be tricky, just because of the multitude of callbacks involved. 
The framework comes with a utility for helping you create models from CSV files or other data sources.
 
To get started, add a `seeder.js` module to your `bin` or `db` directory.
Your seeds should be located in `db/seeds` and should contain headers:

```text
col1,col2,col3,col4
1,2,3,4
5,6,7,8
```

Add models and seeds to an instance of a seeder object:

```javascript
// db/seeder.js
module.exports = function(Seeder,app)
{
    var seeder = Seeder.create('installation');

    seeder.add('media', 'media.csv');
    seeder.add('user', 'users.csv', userParser);

```

Note the user model includes a parsing function, which occurs when the results are read in from the CSV file. In this case, I'm adding a column.

```javascript
// db/seeder.js
function userParser(user,i)
{
    user.userIndex = i;

    return user;
}
```

Running the seeder is done in two parts. First, the CSV is loaded and parsed. Then, you can decide to build models from the data.

```javascript
// db/seeder.js
seeder.run().then(function(){
    
    // My CSV is ready now.
    // But, instead of appending the data, I want to overwrite my current data.
    seeder.get('media').reset = true;
    seeder.get('user').reset = true;

    // Seed the database!
    seeder.seed().then(function(){
        // All the seeds are done seeding.
        process.exit();
    })
})
```

### CLI Utility

`/bin/mvc` is a sample utility that shows how to add custom actions to the application. 

Sometimes it's just useful to type a command to do something. To build a new controller or model:

```bash
./bin/mvc new controller myController

./bin/mvc new model myModel

./bin/mvc new provider myProvider
```

A boilerplate is created from a template and added to your app's corresponding directory.