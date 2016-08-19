var ExpressMVC = require('../index');
var chai = require('chai');
var expect = chai.expect;
var chaiHttp = require('chai-http');
var should = chai.should();

chai.use(chaiHttp);

var app = ExpressMVC.init(__dirname+"/../app", ENV_CLI);
/**
 * Test the application configuration.
 */
describe('config', function()
{
    it('should be a function in the module', function(){
        var config = require('../app/config/config');
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
    });
    it('should have same environment as given', function(){
        expect(app.config.environment).to.equal(ENV_LOCAL);
        expect(app.env).to.equal(ENV_CLI);
    })


});

/**
 * Test the application core.
 */
describe('application', function()
{
    it('should be an instance of an Application', function(){
        expect(app).to.be.an.instanceOf(ExpressMVC.Application);
    });
    it('should parse the package.json', function(){
        expect(app._package).to.be.an('object');
        expect(app.version).to.equal(app._package.version);
    });
    it('should not be booted yet', function(){
        expect(app.booted).to.equal(false);
        expect(app._providers).to.have.length(0);
    })
});