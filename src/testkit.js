var expressway  = require('expressway');
var cheerio     = require('cheerio');
var _           = require('lodash');
GLOBAL.chai     = require('chai');
GLOBAL.chaiHttp = require('chai-http');
GLOBAL.expect   = chai.expect;
GLOBAL.should   = chai.should();

GLOBAL.chai.use(GLOBAL.chaiHttp);

var app = expressway.init(__dirname+"/../demo/app/", ENV_TEST);

/**
 * Testing kit that contains some helper methods.
 * @param app
 * @constructor
 */
function TestingKit(app)
{
    this.app = app;
    this.expressway = expressway;
    this.rootPath = app.rootPath();

    /**
     * Create an API path.
     * @param uri string
     * @returns {string}
     */
    this.apiUrl = function(uri, relative)
    {
        if (relative == undefined) relative = true;
        var path = 'api/v1/'+(uri||"");
        return relative ? "/" + path : app.url(path);
    };


    /**
     * Log in to the application.
     * @param callback function(response,agent)
     */
    this.login = function(callback)
    {
        var agent = chai.request.agent(app.url());

        agent
            .get('login')
            .end(function(err,res)
            {
                // Parse the response and get the token value.
                var $ = cheerio.load(res.text);
                var token = $('input[name="_csrf"]').val();

                agent
                    .post('login')
                    .send({username: "test@bom.us", password: "password", _csrf:token})
                    .then(function(res)
                    {
                        callback(res,agent);
                    })
            });
    };

    /**
     * Check if the response is a valid json with expected results.
     * @param response
     * @param expectedStatus
     * @param dataType
     */
    this.isJsonResponse = function(response, expectedStatus, dataType)
    {
        response.should.have.status(expectedStatus);
        response.should.be.json;
        response.body.should.be.an('object');
        if (dataType) {
            response.body.data.should.be.an(dataType);
        }
    };

    /**
     * Send a request to the server.
     * @param verb string
     * @param uri string
     * @param data object
     * @param agent
     * @returns {*}
     */
    this.request = function(verb,uri,data, agent)
    {
        var uri = _.trim(uri,"/");
        var req = agent ? agent[verb.toLowerCase()](uri) : chai.request(app.url()) [verb.toLowerCase()](uri);
        if (data) {
            req.send(data);
        }
        return req;
    };
}



module.exports = new TestingKit(app);