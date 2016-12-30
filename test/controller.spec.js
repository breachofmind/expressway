var path = require('path');
var expressway = require('expressway');
var Controller = expressway.Controller;

var config = {
    env: ENV_LOCAL,
    url: "http://localhost",
    port: 8081
}
var app = expressway({
    config: config,
    context: CXT_TEST,
    rootPath: path.resolve(__dirname,'../demo')
});

function testMiddleware(request,response,next) {
    next();
}

class TestController extends Controller
{
    simple(request,response,next) {
        return "hello";
    }

    view(request,response,next,view) {

        return view;
    }
}

class TestComplexController extends Controller
{
    constructor(app) {
        super(app);

        this.middleware(testMiddleware);
        this.middleware([
            testMiddleware,
            testMiddleware
        ]);
        this.middleware('index', testMiddleware);
        this.middleware('list', [
            testMiddleware,
            testMiddleware
        ]);
    }

    // should have 3 middleware
    index(request,response,next,app) {
        return arguments;
    }

    // should have 4 middleware
    list(request,response,next) {
        return arguments;
    }
}

/**
 * Test the application configuration.
 */
describe('Controller', function()
{
    it('should be a function', () => {
        expect(Controller).to.be.a('function');
    });

    it('should add a controller with defined name', () => {
        app.controllers.add('test', TestController);
        expect(app.controllers.get('test')).to.be.instanceOf(Controller);

        app.controllers.add("complex",TestComplexController);
        expect(app.controllers.get('complex')).to.be.instanceOf(Controller);
    });
    it('should add a controller using the constructor name', () => {
        app.controllers.add(TestController);
        expect(app.controllers.get('TestController')).to.be.instanceOf(Controller);
    });
    it('should assign the Application instance to a property on the controller', () => {
        let controller = app.controllers.get('test');
        expect(controller.app).to.equal(app);
    });
    it('should have a method', () => {
        let controller = app.controllers.get('test');
        expect(controller.simple).to.be.a('function');
        expect(controller.simple()).to.equal('hello');
    });
    it('should throw if attempting to overwrite a controller', () => {
        expect(function() { app.controllers.add(TestController) }).to.throw(ObjectExistsException);
        expect(function() { app.controllers.add(TestController) }).to.throw(/controller already exists/);

    });


    describe('controllers.list()', function()
    {
        it('should return a list of defined controllers', () => {
            let list = app.controllers.list();
            expect(list).to.be.an('array');
            expect(list).to.have.length(3);
            expect(list[0].name).to.equal('test');
            expect(list[0].index).to.equal(0);
            expect(list[0].object).to.equal(app.controllers.get('test'));
        });

        it('should return a custom sorted array', () => {
            // sorted alpha
            let list = app.controllers.list(function(a,b) {
                return a.name.localeCompare(b.name);
            });
            expect(list[0].name).to.equal('complex');
        })
    });


    describe('controllers.dispatch()', function()
    {
        it('simple: should return middleware array of length 1', () => {
            let output = app.controllers.dispatch('test','simple', app.root);
            expect(output).to.be.an('array');
            expect(output).to.have.length(1);
        });
        it('simple: should return a named route', () => {
            let output = app.controllers.dispatch('test','simple', app.root);
            expect(output[0].$name).to.equal('TestController.simple');
        });
        it('complex: should return middleware array for global and named route', () => {
            let indexRoute = app.controllers.dispatch('complex','index',app.root);
            expect(indexRoute).to.be.an('array');
            expect(indexRoute).to.have.length(5);
            expect(indexRoute[4].$name).to.equal('TestComplexController.index');
        });
        it('complex: should return middleware array where middleware declaration contains array', () => {
            let listRoute = app.controllers.dispatch('complex','list',app.root);
            expect(listRoute).to.be.an('array');
            expect(listRoute).to.have.length(6);
            expect(listRoute[5].$name).to.equal('TestComplexController.list');
        });
    });
});