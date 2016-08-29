var ExpressMVC = require('../src/tests');
var rootPath = ExpressMVC.testRootPath;
var app = ExpressMVC.testApp;
var cheerio = require('cheerio');

// Some test data.
var testMediaData = {
    file_name: "TEST.jpg",
    file_type: "image/jpeg",
    title: "TEST"
};

function http(uri, then)
{
    chai
        .request(app.url('api/v1'))
        .get(uri)
        .end(function(err,res) {
            then(err,res);
    })
}

function login(then)
{
    var agent = chai.request.agent(app.url());
    agent
        .get('login')
        .end(function(err,res) {
            var $ = cheerio.load(res.text);
            var token = $('input[name="_csrf"]').val();

            agent
                .post('login')
                .send({username: "test@bom.us", password: "password", _csrf:token})
                .then(function(res) {
                    then(res,agent);
                })
        });
}



describe('REST', function()
{

    describe('GET /api/v1', function()
    {

        it('should return a JSON', function(done) {
            http('/', function(err,res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                done();
            });
        });

        it('should have an index of public models', function(done) {
            http('/', function(err,res) {
                res.should.have.status(200);
                expect(res.body.index).to.have.property('Media');
                expect(Object.keys(res.body.index)).to.have.length(1);
                done();
            });
        })

    });

    describe('GET /api/v1/:model', function()
    {
        it('should return 404 for undeclared model', function(){
            http('/not-declared', function(err,res) {
                res.should.have.status(404);
                res.should.be.json;
                res.body.should.be.an('object');
            })
        });

        it('should return a JSON for public model', function(done) {
            http('/media', function(err,res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.data.should.be.an('array');
                done();
            })
        });

    });

    describe('POST /api/v1/:model', function()
    {
        it('should not allow unauthenticated user to create model', function(done){
            chai
                .request(app.url('api/v1'))
                .post('/media')
                .send(testMediaData)
                .end(function(err,res) {
                    res.should.have.status(401); // Unauthorized
                    res.should.be.json;
                    res.body.should.be.an('object');
                    done();
            })
        });

        it('should allow authenticated user to create model', function(done) {
            login(function(res,agent){
                agent
                    .post('api/v1/media')
                    .send(testMediaData)
                    .end(function(err,res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.an('object');
                        res.body.data.should.be.an('object');
                        expect(res.body.data).to.have.property('file_name');
                        expect(res.body.data.file_name).to.equal(testMediaData.file_name);

                        // Save the object for later.
                        testMediaData = res.body.data;

                        done();
                    })

            })
        })
    });

    describe('PUT /api/v1/:model/:id', function()
    {
        it('should not allow unauthenticated user to update model', function(done) {
            chai
                .request(app.url('api/v1'))
                .put('/media/'+testMediaData.id)
                .send({title: "changed"})
                .end(function(err,res) {
                    res.should.have.status(401); // Unauthorized
                    res.should.be.json;
                    res.body.should.be.an('object');
                    done();
                })
        });

        it('should allow authenticated user to update model', function(done){
            login(function(res,agent){
                agent
                    .put('api/v1/media/'+testMediaData.id)
                    .send({title: "changed"})
                    .end(function(err,res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.an('object');
                        res.body.data.should.be.an('object');
                        expect(res.body.data.title).to.equal('changed');
                        expect(res.body.data.id).to.equal(testMediaData.id);
                        done();
                    })

            })
        });
    });

    describe('GET /api/v1/:model/:id', function()
    {
        it('should return a JSON for public model', function(done) {
            http('/media/'+testMediaData.id, function(err,res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.data.should.be.an('object');
                expect(res.body.data.id).to.equal(testMediaData.id);
                done();
            })
        })
    });

    describe('DELETE /api/v1/:model/:id', function() {

        it('should not allow unauthenticated user to delete model', function(done) {
            chai
                .request(app.url('api/v1'))
                .delete('/media/'+testMediaData.id)
                .end(function(err,res) {
                    res.should.have.status(401); // Unauthorized
                    res.should.be.json;
                    res.body.should.be.an('object');
                    done();
                })
        });

        it('should allow authenticated user to delete model', function(done) {
            login(function(res,agent){
                agent
                    .delete('api/v1/media/'+testMediaData.id)
                    .end(function(err,res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.an('object');
                        res.body.data.should.be.an('object');
                        expect(res.body.data.results.ok).to.equal(1);
                        expect(res.body.data.results.n).to.equal(1);
                        expect(res.body.data.objectId).to.equal(testMediaData.id);
                        done();
                    })

            })
        });
    })
});




//describe('REST', function(){
//    var url = "http://localhost:8081/api/v1/";
//
//    var itemId;
//
//    it('GET fetchAll returns objects', function(done){
//        request(url).get("media").send().end(function(err,res) {
//            if (err) throw err;
//            should(res).have.property('status',200);
//            should(res).have.property('type','application/json');
//            test.array(res.body.data);
//
//            itemId = res.body.data[0]._id;
//            done();
//        });
//    });
//
//    it('GET fetchOne returns object', function(done){
//        request(url).get("media/"+itemId).send().end(function(err,res) {
//            if (err) throw err;
//            should(res).have.property('status',200);
//            should(res).have.property('type','application/json');
//            test.object(res.body.data);
//            test.string(res.body.data._id).isIdenticalTo(itemId);
//            done();
//        });
//    });
//
//    it('GET returns not found', function(done){
//        request(url).get("notThere").send().end(function(err,res) {
//            if (err) throw err;
//            should(res).have.property('status',404);
//            should(res).have.property('type','application/json');
//            done();
//        });
//    });
//
//    var media = {
//        file_name:"test.jpg",
//        file_type:"image/jpg",
//        title: "testing"
//    };
//
//    var credentials = {
//        username: "mike@bom.us",
//        password: "pwd!118"
//    };
//
//    // Production only.
//    if (config.environment === "production") {
//
//        it('POST returns forbidden in production (csrf)', function(done){
//
//            // Attempt to create.
//            request(url)
//                .post("media")
//                .set('X-REQUESTED-WITH','XMLHttpRequest')
//                .send(media)
//                .end(function(err,res) {
//                    if (err) throw err;
//                    should(res).have.property('status',403);
//                    should(res).have.property('type','application/json');
//                    done();
//                });
//        });
//    }
//
//    // Test creating stuff.
//    if (config.environment !== "production") {
//
//        it('Logs user in', function(done) {
//
//            request('http://localhost:8081').post('/login')
//                .send(credentials)
//                .end(function(err,res) {
//                    should(res).have.property('status',302);
//                    done();
//                })
//        });
//
//        it ('POST creates objects', function(done) {
//
//            request(url)
//                .post("media")
//                .set('X-REQUESTED-WITH','XMLHttpRequest')
//                .send(media)
//                .end(function(err,res) {
//                    if (err) throw err;
//                    should(res).have.property('status',200);
//                    should(res).have.property('type','application/json');
//                    test.object(res.body.data);
//                    should(res.body.data).have.property('title','testing');
//
//                    // For updating
//                    media._id = res.body.data._id;
//
//                    done();
//                });
//        });
//
//        it ('PUT updates objects', function(done) {
//            media.title = "CHANGED";
//            request(url)
//                .put('media/'+media._id)
//                .set('X-REQUESTED-WITH','XMLHttpRequest')
//                .send(media)
//                .end(function(err,res) {
//                    if (err) throw err;
//                    should(res).have.property('status',200);
//                    should(res).have.property('type','application/json');
//                    var data = res.body.data;
//                    test.object(data);
//                    test.string(data._id).isIdenticalTo(media._id);
//                    test.string(data.title).isIdenticalTo("CHANGED");
//
//                    done();
//                });
//        });
//
//        it ('DELETE deletes objects', function(done) {
//
//            request(url)
//                .delete('media/'+media._id)
//                .set('X-REQUESTED-WITH','XMLHttpRequest')
//                .send()
//                .end(function(err,res) {
//                    if (err) throw err;
//                    should(res).have.property('status',200);
//                    should(res).have.property('type','application/json');
//                    should(res.body).have.property('method','DELETE');
//                    var data = res.body.data;
//                    test.object(data);
//                    test.object(data.results);
//                    test.string(data.objectId).isIdenticalTo(media._id);
//                    test.number(data.results.ok).isIdenticalTo(1);
//                    test.number(data.results.n).isIdenticalTo(1);
//
//                    done();
//                });
//
//        });
//
//        it('Logs user out', function(done) {
//
//            request('http://localhost:8081').get('/logout')
//                .send()
//                .end(function(err,res) {
//                    should(res).have.property('status',302);
//                    done();
//                })
//        });
//
//    }
//
//});