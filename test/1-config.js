var path = require('path');
var Expressway = require('expressway');
var testkit = require('../src/support/TestKit');
var app = testkit.app;

/**
 * Test the application configuration.
 */
describe('config', function()
{
    it('should be a function in the module', function(){
        var config = require(app.rootPath('config/config'));
        expect(config).to.be.a('function');
    });
    it('should be an object in the app', function(){
        expect(app.config).to.be.an('object');
    });
    it('should have valid port', function(){
        expect(app.config.port).to.be.within(0,9000);
    });
    it('should have valid environment string', function(){
        var environments = [ENV_LOCAL,ENV_DEV,ENV_PROD,ENV_CLI,ENV_TEST];
        expect(environments).to.include(app.env);
    });
    it('should have an array of providers', function(){
        expect(app.config.providers).to.be.an('array');
        app.config.providers.forEach(function(provider) {
            expect(provider).to.be.a('function');
            expect(new provider).to.be.an.instanceOf(Expressway.Provider);
        })
    });
    it('should have same environment as given', function(){
        expect(app.config.environment).to.equal(ENV_TEST);
        expect(app.env).to.equal(ENV_TEST);
    })
});