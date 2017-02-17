var path = require('path');
var expressway = require('../expressway');
var Dispatcher = require('../src/services/Dispatcher');
var mock = require('../src/support/mock');
var app = mock.app;

class TestMiddleware extends expressway.Middleware
{
    method(request,response,next)
    {
        return "middleware";
    }
}

class TestController extends expressway.Controller
{
    index(request,response,next)
    {
        return "controller";
    }
}

function middleware(request,response,next)
{
    return "anonymous";
}

/**
 * Test the application configuration.
 */
describe('Dispatcher', function()
{
    it('module should be a function', () => {
        expect(Dispatcher).to.be.a('function');
    });

    it('app.load() should return a Dispatcher instance', () => {
        let dispatcher = app.load(Dispatcher);
        expect(dispatcher.constructor.name).to.equal('Dispatcher');
    });

    it('app has instance of dispatcher as a property', () => {
        expect(app.dispatcher).to.be.an('object');
    });

    describe('dispatcher.resolve()', function()
    {
        it('should return middleware array for controllerName.methodName', () => {
            app.controllers.add(TestController);
            let output = app.dispatcher.resolve('TestController.index',app.root);
            expect(output).to.be.an('array');
            expect(output).to.have.length(1);
            expect(output[0](...mock.middleware)).to.equal('controller');
        });

        it('should return middleware array for middlewareName', () => {
            app.middleware.add(TestMiddleware);
            let output = app.dispatcher.resolve('TestMiddleware',app.root);
            expect(output).to.be.an('array');
            expect(output).to.have.length(1);
            expect(output[0](...mock.middleware)).to.equal('middleware');
        });

        it('should return proper middleware given an array of different types', () => {
            let items = [
                'TestController.index',
                'TestMiddleware',
                middleware,
                null,
                undefined
            ];
            let output = app.dispatcher.resolve(items, app.root);
            expect(output).to.be.an('array');
            expect(output).to.have.length(3);
            expect(output[0](...mock.middleware)).to.equal('controller');
            expect(output[1](...mock.middleware)).to.equal('middleware');
            expect(output[2](...mock.middleware)).to.equal('anonymous');
        });

        it('should throw if specified controller does not exist', () => {
            expect(function() { app.dispatcher.resolve('Missing.Controller', app.root) }).to.throw('controller does not exist: Missing');
        });

        it('should throw if specified middleware does not exist', () => {
            expect(function() { app.dispatcher.resolve('Missing', app.root) }).to.throw('middleware does not exist: Missing');
        });

        it('should throw if controller method does not exist', () => {
            expect(function() { app.dispatcher.resolve('TestController.missing', app.root) }).to.throw('controller method does not exist: TestController.missing');
        });
    });

});