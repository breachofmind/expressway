var path = require('path');
var expressway = require('expressway');
var Application = require('../src/Application');
var Extension = require('../src/Extension');
var ObjectCollection = require('../src/ObjectCollection');
var mock = require('../src/support/mock');
var app = mock.app;

const ROOT_PATH = path.resolve(__dirname,'../demo');

/**
 * Test the application configuration.
 */
describe('Application', function()
{
    it('should be a function', () => {
        expect(Application).to.be.a('function');
    });

    it('expressway() should return instance of Application', () => {
        expect(app).to.be.instanceOf(Application);
    });

    it('should set the config object', () => {
        expect(app.config).to.be.an('object');
        expect(app.config.port).to.equal(8081);
    });

    it('should set context, environment and rootPath', () => {
        expect(app.env).to.equal(ENV_LOCAL);
        expect(app.context).to.equal(CXT_TEST);
        expect(app.rootPath).to.equal(ROOT_PATH);
    });

    it('should have service, provider, controller and middleware ObjectCollection', () => {
        expect(app.services).to.be.instanceOf(ObjectCollection);
        expect(app.providers).to.be.instanceOf(ObjectCollection);
        expect(app.controllers).to.be.instanceOf(ObjectCollection);
        expect(app.middleware).to.be.instanceOf(ObjectCollection);
    });

    it('should create a root extension', () => {
        expect(app.extensions.get('root')).to.be.instanceOf(Extension);
        expect(app.root).to.be.instanceOf(Extension);
        expect(app.root).to.equal(app.extensions.get('root'));
    });
    it('should add the root extension as a service', () => {
        expect(app.service('root')).to.be.instanceOf(Extension);
        expect(app.service('root')).to.equal(app.extensions.get('root'));
    });

    describe('config', function()
    {
        it('should be an object in the app', function(){
            expect(app.config).to.be.an('object');
        });
        it('should have valid port', function(){
            expect(app.config.port).to.be.within(0,9000);
        });
        it('should have valid environment string', function(){
            expect(ENV_ALL).to.include(app.env);
        });
        it('should have valid context string', function(){
            expect(CXT_ALL).to.include(app.context);
        });
    })

    var testStr = "TEST!";
    var testObj = {testing:true};
    var testFn = function(arg) { return arg }
    function namedFn () {
        return 'named';
    }

    describe('app.service()', function()
    {
        it('should have the app defined as a service', () => {
            expect(app.service('app')).to.equal(app);
        });

        it('should throw if a service does not exist', () => {
            expect(function() { app.service('none') }).to.throw('service does not exist: none');
        });

        it('should set a service as a string value', () => {
            app.service('testStr', testStr);
            expect(app.service('testStr')).to.equal(testStr);
        });

        it('should set a service as an object value', () => {
            app.service('testObj', testObj);
            expect(app.service('testObj')).to.equal(testObj);
            expect(app.service('testObj').testing).to.equal(true);
        });

        it('should set a service as a function value', () => {
            app.service('testFn',testFn);
            expect(app.service('testFn')).to.be.a('function');
            expect(app.service('testFn')).to.equal(testFn);
            expect(app.service('testFn')(5)).to.equal(5);
        });
        it('should use function name if no name given', () => {
            app.service(namedFn);
            expect(app.service('namedFn')).to.be.a('function');
            expect(app.service('namedFn')).to.equal(namedFn);
        });
        it('should throw if attempting to use anonymous function as a service with no name', () => {
            expect(function() { app.service(function(){ return "anon"; }) }).to.throw('first argument must be string or named function');
        });
        it('should throw if non-string given as first argument', () => {
            expect(function() { app.service(1,"test") }).to.throw('service name must be string');
        })

        it('should throw when attempting to overwrite a defined service', () => {
            expect(function() { app.service('testStr', "OVERWRITE!") }).to.throw(ObjectExistsException);
            expect(function() { app.service('testStr', "OVERWRITE!") }).to.throw(`service already exists`);
        });

        it('should return one service using app.get(name)', () => {
            expect(app.get('testStr')).to.equal(testStr);
        });

        it('should return array of services using app.get(name1,name2,...)', () => {
            let output = app.get('testStr','testObj','testFn');
            expect(output).to.have.length(3);
            expect(output).to.be.an('array');
        });

        it('should set a default logger', () => {
            expect(app.get('log')).to.be.an('object');
        });
        it('should set a default debug function', () => {
            expect(app.get('debug')).to.be.a('function');
        })
    });

    describe('app.call()', function()
    {
        let fn = function(testStr,testObj,testFn) {
            return arguments;
        };
        let obj = {
            method(testStr,testObj,testFn) {
                return arguments;
            }
        };
        class ClassObject {
            constructor(testStr,testObj,testFn) {
                this.args = [testStr,testObj,testFn];
            }
        }

        // Calling function tests.
        let callFn = function(padded0,padded1,testStr) {
            return arguments;
        };
        callFn.$call = true;

        let callBaseFn = function(padded0,padded1,callFn) {
            return callFn;
        };

        let testStrOverride = "testing override";

        it('should inject services into a function', () => {
            let output = app.call(fn);
            expect(output[0]).to.equal(testStr);
            expect(output[1]).to.equal(testObj);
            expect(output[2]).to.equal(testFn);
        });
        it('should inject services into an object method', () => {
            let output = app.call(obj,'method');
            expect(output[0]).to.equal(testStr);
            expect(output[1]).to.equal(testObj);
            expect(output[2]).to.equal(testFn);
        });
        it ('should inject services into a constructor method', () => {
            let output = app.call(ClassObject);
            expect(output).to.be.an('object');
            expect(output.args).to.be.an('array');
            expect(output.args[0]).to.equal(testStr);
            expect(output.args[1]).to.equal(testObj);
            expect(output.args[2]).to.equal(testFn);
        })
        it('should pad arguments from the left when given for function', () => {
            let output = app.call(fn,[testStrOverride]);
            expect(output[0]).to.equal(testStrOverride);
            expect(output[1]).to.equal(testObj);
            expect(output[2]).to.equal(testFn);
        });
        it('should pad arguments from the left when given for object method', () => {
            let output = app.call(obj,'method',[testStrOverride]);
            expect(output[0]).to.equal(testStrOverride);
            expect(output[1]).to.equal(testObj);
            expect(output[2]).to.equal(testFn);
        });
        it('should call a function within a called function and include padded args when using $call', () => {
            app.service(callFn);
            let output = app.call(callBaseFn,[1,2]);
            expect(output[0]).to.equal(1);
            expect(output[1]).to.equal(2);
            expect(output[2]).to.equal(testStr);
        });
        it('should throw if service is not found', () => {
            let badFn = function(missingService) {
                return arguments;
            };
            expect(function() { app.call(badFn) }).to.throw(ApplicationCallError);
            expect(function() { app.call(badFn) }).to.throw(/service does not exist/);
        });
        it('should inject into the parent constructor if child constructor not defined', () => {
            class Parent {
                constructor(testStr,testObj,testFn) {this.args = arguments;}
            }
            class Child extends Parent{
                test() {return this.args}
            }
            let output = app.call(Child);
            let test = output.test();
            expect(test).to.have.length(3);
            expect(test[0]).to.equal(testStr);
            expect(test[1]).to.equal(testObj);
            expect(test[2]).to.equal(testFn);
        });
    });

    describe('app.alias()', function()
    {
        var testAlias = "/var/www/html";
        it('should be a method', () => {
            expect(app).to.respondTo('alias');
        });
        it('should have an ObjectCollection', () => {
            expect(app.aliases).to.be.instanceof(ObjectCollection);
        })
        it('should create an alias', () => {
            expect(app.alias('test',testAlias)).to.equal(app);
            expect(app.aliases.has('test')).to.equal(true);
        });
        it('should get an alias', () => {
            expect(app.alias('test')).to.equal(testAlias);
        });
        it('should throw if attempting to overwrite an alias', () => {
            expect(function() { app.alias('test',"overwrite") }).to.throw(/alias already exists/);
        })
    });

    describe('app.callFn()', function()
    {
        it('should be a method', () => {
            expect(app).to.respondTo('callFn');
        });
        it('should return a function that is the wrapper', () => {
            let fn = function(testStr) {
                return testStr;
            };
            let wrapper = app.callFn(fn);
            expect(wrapper).to.be.a('function');
            expect(wrapper).to.not.equal(fn);
            expect(wrapper()).to.equal(testStr);
        });
        it('should call a function using padding args', () => {
            let fn = function(arg0,arg1,testStr) {
                return arguments;
            };
            let wrapper = app.callFn(fn);
            let output = wrapper(1,2);
            expect(output[0]).to.equal(1);
            expect(output[1]).to.equal(2);
            expect(output[2]).to.equal(testStr);
        });
        it('should work with event listeners', () => {
            let output;
            let fn = function(arg0,arg1,testStr) {
                output = arguments;
            };
            app.on('test', app.callFn(fn));
            app.emit('test', 1,2);
            expect(output[0]).to.equal(1);
            expect(output[1]).to.equal(2);
            expect(output[2]).to.equal(testStr);
        });
        it('should throw if non-function given as argument', () => {
            expect(function() { app.callFn('whaaa') }).to.throw(TypeError);
            expect(function() { app.callFn('whaaa') }).to.throw('argument must be a function');
        })
    })
});