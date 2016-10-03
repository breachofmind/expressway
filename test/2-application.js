var path = require('path');
var Expressway = require('expressway');
var testkit = require('../src/support/TestKit');
var app = testkit.app;

/**
 * Test the application core.
 */
describe('application', function()
{

    it('should be an instance of Expressway', function()
    {
        expect(testkit.expressway).to.be.an.instanceOf(Expressway);
    });

    it('should be an instance of an Application', function()
    {
        expect(app).to.be.an.instanceOf(Expressway.Application);
    });

    it('should parse the package.json', function()
    {
        expect(app._package).to.be.an('object');
        expect(app.getVersion()).to.equal(app._package.version);
    });

    it('should not be booted yet', function()
    {
        expect(app._booted).to.equal(false);
        expect(app.providers).to.be.empty;
    });


    // Bootstrap
    it('should bootstrap', function()
    {
        expect(app.bootstrap()).to.be.instanceOf(Expressway.Application);
        expect(app._booted).to.equal(true);
    });

    it('should have providers after bootstrap', function()
    {
        expect(app.providers).to.not.be.empty;
        // Providers should be added to the index by name, though not loaded.
        expect(Object.keys(app.providers).length).to.equal(app.config.providers.length);
        expect(app._order).to.not.be.empty;
    });

    it('should have open database connection', function()
    {
        var db = app.get('db');
        expect(db).to.be.an('object');
        expect(db.connection.readyState).to.equal(1); // connected
    });

    it('should have attached model provider class', function()
    {
        expect(app.has('ModelProvider')).to.equal(true);
        expect(app.get('ModelProvider')).to.be.an('object');
        expect(Expressway.Model.prototype).to.be.instanceOf(Expressway.BaseModel);
    });

    it('should have attached controller factory class', function()
    {
        expect(app.has('ControllerProvider')).to.equal(true);
        expect(app.get('ControllerProvider')).to.be.an('object');
        expect(Expressway.Controller).to.be.a('function');
    });

    it('should have Template and View classes', function()
    {
        expect(app.get('Template')).to.be.a('function');
        expect(app.get('View')).to.be.a('function');
        expect(Expressway).to.have.property('Template');
        expect(Expressway).to.have.property('View');
    });

    it('should have a router instance', function()
    {
        var router = app.get('router');
        expect(router).to.be.an('object');
        expect(router.constructor.name).to.equal('Router');
    });

    it('should have a list of routes', function()
    {
        var router = app.get('router');
        var list = router.list();
        expect(list).to.be.an('array');
        expect(list.length).to.be.above(0);
    });
});