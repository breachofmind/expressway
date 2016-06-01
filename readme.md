# Express MVC

This is just a handy little starter framework. Includes:

- Express.js webserver
- MongoDB Database and mongoose ORM
- Controllers and parameter binding
- Smart response rendering (objects render as JSON)
- CRUD API and JSON response
- Range-based pagination in JSON API
- User authentication and session storage
- Pug templates
- CSV to JSON database seeding

## Usage

Create an application directory, similar to this one:
/app
/app/config.js
/app/routes.js
/app/models
/app/controllers

Require the class object in the file that will run your server. Be sure to change the Application.root path to your app directory.

```javascript

var ExpressMVC = require('express-mvc');
 
ExpressMVC.Application.root = __dirname + "/app/";
 
var app = ExpressMVC.Application.create().bootstrap().server();
 
```

### Controllers

Controllers help organize your routes and join data with your views. To make a controller, create a file and include the file in your config.js.

```javascript

var Controller = require('express-mvc').Controller;

Controller.create('indexController', function(controller){

    // Your controller setup happens here, where parameter bindings can occur or globals set.
    controller.bind('id', function(value,request,response) {
        // For the url pattern /model/:id, value will be the :id parameter value.
    }
    
    var globalVar = 5;
    
    return {
        index: function(request,response,next) {
        
            // Return a view, string or object. Objects are serialized into JSON responses.
            return "Hello!";
        }
    }

});

```