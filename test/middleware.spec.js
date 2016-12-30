var path = require('path');
var expressway = require('expressway');
var mock = require('../src/support/mock');
var Middleware = expressway.Middleware;
var app = mock.app;


const TEST_INJECTABLE = "STRING!";

class TestMiddleware extends Middleware
{
    method(request,response,next)
    {
        return "hello";
    }
}


class TestInjectMiddleware extends Middleware
{
    method(request,response,next,injectable)
    {
        return arguments;
    }
}

class TestDispatchMiddleware extends Middleware
{
    constructor(app)
    {
        super(app);
        this.property = "HELLO";
    }

    dispatch(extension, injectable)
    {
        let self = this;

        return function testMiddleware(request,response,next)
        {
            return [extension,injectable,self.property]
        }
    }
}

/**
 * Test the application configuration.
 */
describe('Middleware', function()
{
    it('should be a function', () => {
        expect(Middleware).to.be.a('function');
    });
    it('should add a middleware with defined name', () => {
        app.middleware.add('test', TestMiddleware);
        expect(app.middleware.get('test')).to.be.instanceOf(Middleware);
    });
    it('should add a middleware using the constructor name', () => {
        app.middleware.add(TestMiddleware);
        expect(app.middleware.get('TestMiddleware')).to.be.instanceOf(Middleware);
    });
    it('should assign the Application instance to a property on the middleware', () => {
        let middleware = app.middleware.get('test');
        expect(middleware.app).to.equal(app);
    });
    it('should have a method', () => {
        let middleware = app.middleware.get('test');
        expect(middleware.method).to.be.a('function');
        expect(middleware.method()).to.equal('hello');
    });
    it('should throw if attempting to overwrite a middleware', () => {
        expect(function() { app.middleware.add(TestMiddleware) }).to.throw(ObjectExistsException);
        expect(function() { app.middleware.add(TestMiddleware) }).to.throw(/middleware already exists/);
    });

    it('should create anonymous middleware using Middleware.create()', () => {
        let fn = Middleware.create(function anon(request,response,next) {
            return "anonymous";
        });
        expect(fn).to.be.a('function');
        let instance = new fn(app);
        expect(instance).to.be.instanceOf(Middleware);
        let middleware = instance.dispatch(app.root);
        expect(middleware).to.be.a('function');
        expect(middleware(...mock.middleware)).to.equal('anonymous');
    })

    it('should allow adding an array of middleware', () =>  {
        let middlewares = [
            {name:"m1", object:Middleware.create(function m1(req,res,next) { return 1; })},
            {name:"m2", object:Middleware.create(function m2(req,res,next) { return 2; })},
            {name:"m3", object:Middleware.create(function m3(req,res,next) { return 3; })},
        ];
        app.middleware.add(middlewares);
        expect(app.middleware.get('m1')).to.be.instanceOf(Middleware);
        expect(app.middleware.get('m2')).to.be.instanceOf(Middleware);
        expect(app.middleware.get('m3')).to.be.instanceOf(Middleware);
    });

    describe('middleware.dispatch()', function()
    {
        app.service('injectable', TEST_INJECTABLE);
        app.middleware.add('injectable',TestInjectMiddleware);
        app.middleware.add('dispatchable',TestDispatchMiddleware);

        it('should return an array of middleware functions', () => {
            let output = app.middleware.dispatch('test', app.root);
            expect(output).to.be.an('array');
            expect(output[0]).to.be.a('function');
            expect(output[0].$name).to.equal('TestMiddleware');
        });

        it('should inject services if using method()', () => {
            let arr = app.middleware.dispatch('injectable', app.root);
            let output = arr[0](...mock.middleware);
            expect(output).to.have.length(4);
            expect(output[3]).to.equal(TEST_INJECTABLE);
        });

        it('should inject into the dispatch method and return middleware array', () => {
            let arr = app.middleware.dispatch('dispatchable', app.root);
            expect(arr).to.be.an('array');
            let output = arr[0](...mock.middleware);
            expect(output).to.be.an('array');
            expect(output[0]).to.equal(app.root);
            expect(output[1]).to.equal(TEST_INJECTABLE);
            expect(output[2]).to.equal("HELLO");
        });

        it('should use the function name as $name if using dispatch() and dispatcher', () => {
            let arr = app.dispatcher.resolve('dispatchable', app.root);
            expect(arr).to.be.an('array');
            expect(arr[0].$name).to.equal('testMiddleware');
        })
    });
});