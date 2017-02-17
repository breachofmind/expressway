var path = require('path');
var expressway = require('../expressway');
var mock = require('../src/support/mock');
var app = mock.app;
var ObjectCollection = require('../src/ObjectCollection');
var Promise = require('bluebird');

class People extends expressway.Model {}

app.use([
    require('../src/providers/ModelProvider'),
    People
]);

var data = [
    {name:"John", type:"Human"},
    {name:"Rick", type:"Robot"},
    {name:"Henry", type:"Android"},
];



describe('Seeder', function()
{
    it('should have been added as a service using ModelProvider', () => {
        expect(app.services.has('seeder')).to.equal(true);
        expect(app.services.get('seeder')).to.be.an('object');
        expect(app.get('seeder')).to.be.instanceOf(ObjectCollection);
    });

    var seeder = app.get('seeder');

    it('should create a seeder', () => {
        var testSeeder = seeder.add('test', {active:false});
        expect(testSeeder).to.be.an('object');
        expect(testSeeder.name).to.equal('test');
        expect(testSeeder).to.respondTo('prepare');
        expect(testSeeder).to.respondTo('seed');
    });

    it('should create a seed with an array', () => {
        var testSeeder = seeder.get('test');
        var seed = testSeeder.add('People', data);
        expect(seed.source).to.be.an('array');
        expect(seed.source).to.have.length(3);
    });

    it('should prepare a seed with an array and return a promise', (done) => {
        var testSeeder = seeder.get('test');
        let promise = testSeeder.prepare();
        expect(promise).to.be.instanceOf(Promise);

        promise.then(result => {
            let json = testSeeder.toJSON();
            expect(json).to.be.an('object');
            expect(json.People).to.be.an('array');
            expect(json.People[0]).to.be.an('object');
            expect(json.People[0].name).to.equal('John');

            done();
        })
    });

});