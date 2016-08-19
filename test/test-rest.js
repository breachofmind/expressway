var ExpressMVC = require('../src/tests');
var rootPath = ExpressMVC.testRootPath;
//var app = ExpressMVC.testApp();


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