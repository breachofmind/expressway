# Expressway (beta)

__Expressway__ is an extensible, [MEAN](http://mean.io/) microframework for Node.js, designed to be completely modular.
It is heavily influenced by Taylor Otwell's [Laravel](https://laravel.com) for PHP and 
Google's front-end framework, [AngularJS](https://angularjs.org).
```bash
npm install breachofmind/expressway --save
# Or, for cool kids:
yarn add breachofmind/expressway
```
## Features
- __Open source foundation.__
Like Laravel, Expressway believes in using well-tested open-source components to make up it's core code.
Core components include [Express](https://expressjs.com), [Mongoose](http://mongoosejs.com/),
[NodeMailer](https://nodemailer.com/), [Passport](http://passportjs.org/),
[Commander CLI](https://github.com/tj/commander.js/), and many common 
[Express middleware modules](https://github.com/breachofmind/expressway/tree/master/src/middlewares).
- __Angular-style Dependency Injection.__ Also known as IOC (Inversion of control), Expressway allows you
to declare services that can be injected into your functions and class methods.
- __Cutting edge.__ Expressway is written in ES2015 using classes and inheritance. This makes it easy to 
extend core classes to overwrite or enhance existing functionality.
- __Not opinionated.__ Developers are anal. Some like `src`, some like `lib`. 
Expressway is designed to be agnostic to your application's structure.
- __Big or Little.__ Your project could be as simple as a couple routes or massive with many controllers and routes.
Expressway can be as organized or disorganized as you want.
- __Controller and Middleware classes.__ Separate your middleware stacks 
and business logic into composable and configurable modules.
- __The Missing CLI.__ Need to quickly see your route stack, services and models? You need a CLI for that.

![Route Stack output](http://bom.us/theme/images/route-stack.png)

### Dependency Injection
Quite possibly the most useful feature is Expressway's IOC implementation, which is borrowed almost exactly from AngularJS.

1. Define a service.
2. Add the service name to a function's arguments.
3. Call the function using `app.call(function)`.
4. Profit.
```javascript
app.service('profit', "No more require()!");

function myFunction(profit) {
    return profit;
}
app.call(myFunction); // "No more require()"!
```
This is a very simple example. Imagine how useful this is when it's available in your controller routes:
```javascript
class MyController extends expressway.Controller
{
    /**
    * MyController.index route.
    * GET /
    */
    index(request,response,next,profit) {
        return profit;
    }
}
```
Services can be anything - strings, functions, objects, etc.

## Usage
### Yeoman generator
If you just want to get started with a sensible structure,
the [Expressway Yeoman generator](https://github.com/breachofmind/generator-expressway) is the way to go.
```bash
npm install breachofmind/expressway-generator -g
mkdir myApp && cd myApp
yo expressway myApp
```

### Quick and Dirty
- Install the package using `npm install breachofmind/expressway.`
- Create an entry file:

```javascript
// expressway.js
var expressway = require('expressway');
var app = expressway({
    rootPath: __dirname,
});

// Add some services.
function motivationalQuote() {
    return `A nation that separates it's warriors from 
    its scholars will have its fighting done by fools 
    and its thinking done by cowards.`;
}

app.service(motivationalQuote);

// Expressway apps have a "root" app.
// Any extensions you might add later are mounted to this root app.
app.root.routes = [
    {
        // Routes are added in a declarative manner.
        "GET /" : function(request,response,next) {
            return response.send("Hello World");
        },
        // Anonymous routes allow for dependency injection.
        "GET /quote" : function(request,response,next,motivationalQuote) {
            return response.send( motivationalQuote() );
        },
        // As your app gets bigger, you might want to add a controller.
        "GET /:model" : "ModelController.fetchAll",
        
        // You may want to stack middleware on a route.
        "POST /:model/:id" : [
            // The name of a middleware to pass through.
            "ModelRequest", 
            // An anonymous middleware.
            function(request,response,next) {
                console.log('middleware test');
                next();
            },
            // Add finally, the controller method I wanted.
            "ModelController.save"
        ]
    },
    // A simple "NotFound" middleware in case nothing is matched.
    'NotFound'
];

// Start the server.
app.start();
```
- Run the file: `node expressway.js`
- Build something interesting.

## Documentation
The [Wiki](https://github.com/breachofmind/expressway/wiki) is where it's at.  
I'll be adding more documentation very soon as the API smooths out.

## Testing
```bash
mocha test
```