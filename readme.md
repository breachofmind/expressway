# Expressway v.0.6.0 alpha

Expressway is an extensible microframework for Node and Express. It is designed to be 
agnostic to your application's requirements, meaning it can be used with MongoDB, MySQL,
Any view engine, any mailer solution, etc. Since it's provider-based, every system module can
be swapped out entirely with your own implementation, if you don't like the default implementation.

- Express.js webserver
- MySQL or MongoDB database drivers
- IoC (Inversion of Control) dependency injection
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

## IOC (Inversion of Control) Dependency Injection
Do you like how Angular injects services and class instances into your controllers? You can do that.
In fact, the source code for dependency injection is taken almost directly from Angular.
Here's an example:
```javascript
function sayHelloFunc() {
    return "Hello";
}
app.register('sayHello', sayHelloFunc, "Says Hello");
app.register('worldString', "World", "Just a value");

function hello(sayHello, worldString) {
    return sayHello() + " " + worldString;
}

// app.call injects the services by name as function arguments
app.call(hello); // "Hello World"
```

Even better, you can register a constructor to do all this work for you.
Very useful if your classes depend on a number of other classes.
Beats doing `new Class()` all day!
```javascript
function HelloWorldClass(sayHello, worldString) {
    this.output = sayHello() + " " + worldString;
}
// Don't forget the "true" argument at the end.
// This tells the application to construct the class each time, with the injected services.
app.register('helloWorld', HelloWorldClass, "Creates a new class each time the service is called", true);

function hello(helloWorld) {
    return helloWorld.output;
}
app.call(hello); // "Hello World"
```

Get services anytime, if you're using them in modules.
```javascript
var app = require('expressway').instance.app;
var helloWorld = app.get('helloWorld');

console.log(helloWorld.output); // "Hello World"
```

## Documentation
Check out the [Wiki](https://github.com/breachofmind/expressway/wiki) for way more info.