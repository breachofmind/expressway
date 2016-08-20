var path = require('path');
var ExpressMVC = require('../src/tests');
var rootPath = ExpressMVC.testRootPath;
var app = ExpressMVC.testApp;

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
        expect(app.config.providers[0]).to.be.a('object');
        expect(app.config.providers[0]).to.be.an.instanceOf(ExpressMVC.Provider);
    });
    it('should have same environment as given', function(){
        expect(app.config.environment).to.equal(ENV_LOCAL);
        expect(app.env).to.equal(ENV_TEST);
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
    it('should have rootpath that we gave it', function(){
        expect(app.rootPath()).to.equal(path.normalize(rootPath));
        expect(app.rootPath('config')).to.equal(path.normalize(rootPath+'config'));
    });
    it('should not be booted yet', function(){
        expect(app.booted).to.equal(false);
        expect(app._providers).to.be.empty;
    });

    // Bootstrap
    it('should bootstrap', function(){
        expect(app.bootstrap()).to.be.instanceOf(ExpressMVC.Application);
        expect(app.booted).to.equal(true);
    });
    it('should have providers after bootstrap', function(){
        expect(app._providers).to.not.be.empty;
        // Providers should be added to the index by name, though not loaded.
        expect(Object.keys(ExpressMVC.Provider.get()).length).to.equal(app.config.providers.length);
        // Some providers are only loaded based on the environment.
        expect(app._providers.length).to.be.below(app.config.providers.length);
    });
    it('should have open database connection', function(){
        expect(app.db).to.be.an('object');
        expect(app.db.connection.readyState).to.equal(1); // connected
    });
    it('should have attached model factory class', function(){
        expect(app).to.have.property('ModelFactory');
        expect(app.ModelFactory).to.be.a('function');
    });
    it('should have attached controller factory class', function(){
        expect(app).to.have.property('ControllerFactory');
        expect(app.ControllerFactory).to.be.a('function');
    });
    it('should have template and view classes', function(){
        expect(app).to.have.property('Template');
        expect(app.Template).to.be.a('function');
        expect(app).to.have.property('View');
        expect(app.View).to.be.a('function');
    });
    it('should have a router class', function(){
        expect(app).to.have.property('router');
        expect(app.router).to.be.a('object');
    });
    it('should have a list of routes', function(){
        var list = app.router.list();
        expect(list).to.be.an('array');
        expect(list.length).to.be.above(0);
    });
});