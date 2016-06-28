# Express MVC

This is just a handy little starter framework. Includes:

- Express.js webserver
- MongoDB Database and mongoose ORM
- Controllers and parameter binding
- Smart response rendering (objects render as JSON)
- CRUD API and JSON response
- Range-based pagination in JSON API
- User authentication and session storage
- Pug templates, but ability to override
- CSV to JSON database seeding
- CLI utility for custom actions
- Locale support

## Usage

Create an application directory, similar to this one:
/app
/app/config.js
/app/routes.js
/app/models
/app/controllers
/app/lang
/app/views

Require the class object in the file that will run your server. Be sure to change the Application.root path to your app directory.

```javascript

var ExpressMVC = require('express-mvc');
 
ExpressMVC.Application.root = __dirname + "/app/";
 
var app = ExpressMVC.Application.create().bootstrap().server();
 
```

### Controllers

Controllers help organize your routes and join data with your views. To make a controller, create a file and include the file in your config.js.

```javascript

// /app/controllers/index.js

var Controller = require('express-mvc').Controller;

Controller.create('indexController', function(controller){

    // Your controller setup happens here, where parameter bindings can occur or globals set.
    
    controller.bind('id', function(value,request,response) {
        // For the url pattern /model/:id, value will be the :id parameter value.
    }
    
    var globalVar = 5;
    
    // The return object contains your controller methods.
    return {
        index: function(request,response,next) {
        
            // Return a view, string or object. Objects are serialized into JSON responses.
            return "Hello!";
        }
    }

});

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

In your markup, use the `lang` method:

```
h1=lang("myKey", ["Johnny", "Rico"])

p=lang("anotherKey")
```

