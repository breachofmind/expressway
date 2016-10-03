var testkit = require('../src/support/TestKit');
var app = testkit.expressway.app;
var api = testkit.apiUrl;

// Some test data.
var data = {
    file_name:  "TEST.jpg",
    file_type:  "image/jpeg",
    title:      "TEST"
};


describe('REST', function()
{
    describe('GET /api/v1', function()
    {
        var uri = api('/');

        it('should return a JSON', function(done) {
            testkit.request('GET', uri).end(function(err,res) {
                testkit.isJsonResponse(res,200);
                done();
            });
        });

        it('should have an index of public models if unauthenticated', function(done) {
            testkit.request('GET', uri).end(function(err,res) {
                expect(res.body.index).to.have.property('Media');
                expect(Object.keys(res.body.index)).to.have.length(1);
                done();
            });
        });

        it('should have an index of all models if authenticated', function(done) {
            testkit.login(function(res,agent) {
                testkit.request('GET', uri, null, agent).end(function(err,res) {
                    expect(res.body.index).to.have.property('Media');
                    expect(res.body.index).to.have.property('User');
                    expect(res.body.index).to.have.property('Role');
                    expect(Object.keys(res.body.index)).to.have.length(3);
                    done();
                })
            });
        })
    });

    describe('GET /api/v1/:model', function()
    {
        it('should return 404 for undeclared model', function(done){
            testkit.request('GET',api('not-declared')).end(function(err,res) {
                testkit.isJsonResponse(res,404);
                done();
            });
        });

        it('should return a JSON for public model', function(done) {
            testkit.request('GET', api('media')).end(function(err,res) {
                testkit.isJsonResponse(res,200,'array');
                done();
            });
        });

        it('should not allow unauthenticated user to see private model', function(done) {
            testkit.request('GET', api('role')).end(function(err,res) {
                testkit.isJsonResponse(res,401);
                done();
            });
        });

        it('should allow authenticated user to see private model', function(done) {
            testkit.login(function(res,agent) {
                testkit.request('GET', api('role'),null,agent).end(function(err,res) {
                    testkit.isJsonResponse(res,200,'array');
                    done();
                })
            })
        })

    });

    describe('POST /api/v1/:model', function()
    {
        var uri = api('media');

        it('should not allow unauthenticated user to create model', function(done){
            testkit.request('POST', uri, data).end(function(err,res) {
                testkit.isJsonResponse(res,401,'object');
                done();
            });
        });

        it('should allow authenticated user to create model', function(done) {
            testkit.login(function(res,agent) {
                testkit.request('POST', uri, data, agent).end(function(err,res) {
                    testkit.isJsonResponse(res,200,'object');
                    expect(res.body.data).to.have.property('file_name');
                    expect(res.body.data.file_name).to.equal(data.file_name);

                    // Save the object for later.
                    data = res.body.data;
                    done();
                })
            });
        })
    });

    describe('PUT /api/v1/:model/:id', function()
    {
        var changeData = {title: "changed"};

        it('should not allow unauthenticated user to update model', function(done) {
            var uri = api('media/'+data.id);
            testkit.request('PUT', uri, changeData).end(function(err,res) {
                testkit.isJsonResponse(res,401,'object');
                done();
            });
        });

        it('should allow authenticated user to update model', function(done){
            var uri = api('media/'+data.id);
            testkit.login(function(res,agent) {
                testkit.request('PUT', uri, changeData, agent).end(function(err,res) {
                    testkit.isJsonResponse(res,200,'object');
                    expect(res.body.data.title).to.equal(changeData.title);
                    expect(res.body.data.id).to.equal(data.id);
                    done();
                })
            });
        });
    });

    describe('GET /api/v1/:model/:id', function()
    {
        it('should return 400 if not valid object ID', function(done){
            testkit.request('GET', api('media/1234')).end(function(err,res) {
                testkit.isJsonResponse(res,400);
                done();
            })
        });

        it('should return 404 if missing but valid object ID', function(done){
            testkit.request('GET', api('media/50c4ab8ceb67b0b90f1e03ee')).end(function(err,res) {
                testkit.isJsonResponse(res,404);
                done();
            })
        });

        it('should return 404 for undeclared model', function(done){
            testkit.request('GET', api('not-declared/1234')).end(function(err,res) {
                testkit.isJsonResponse(res,404);
                done();
            })
        });

        it('should return a JSON for public model', function(done) {
            var uri = api('media/'+data.id);
            testkit.request('GET', uri).end(function(err,res) {
                testkit.isJsonResponse(res,200,'object');
                expect(res.body.data.id).to.equal(data.id);
                done();
            });
        });
    });

    describe('DELETE /api/v1/:model/:id', function()
    {
        it('should not allow unauthenticated user to delete model', function(done) {
            var uri = api('media/'+data.id);
            testkit.request('DELETE', uri).end(function(err,res) {
                testkit.isJsonResponse(res,401);
                done();
            });
        });

        it('should allow authenticated user to delete model', function(done) {
            var uri = api('media/'+data.id);
            testkit.login(function(res,agent) {
                testkit.request('DELETE', uri, null, agent).end(function(err,res) {
                    testkit.isJsonResponse(res,200,'object');
                    expect(res.body.data.results.ok).to.equal(1);
                    expect(res.body.data.results.n).to.equal(1);
                    expect(res.body.data.objectId).to.equal(data.id);
                    done();
                })
            });
        });
    });
});