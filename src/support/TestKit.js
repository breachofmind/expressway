"use strict";

var _           = require('lodash');
var Expressway  = require('expressway');
var cheerio     = require('cheerio');
global.chai     = require('chai');
global.chaiHttp = require('chai-http');
global.expect   = chai.expect;
global.should   = chai.should();

chai.use(global.chaiHttp);

var expressway = Expressway.init(__dirname+"/../../demo/app/", CXT_TEST);
var app = expressway.app;

var url = function(path) {
    return app.get('url')(path);
}

/**
 * A helper class for running tests
 * for Expressway.
 */
class TestKit
{
    /**
     * Create an API path.
     * @param uri string
     * @returns {string}
     */
    apiUrl(uri,relative)
    {
        if (relative == undefined) relative = true;
        var path = 'api/v1/'+(uri||"");
        return relative ? "/" + path : url(path);
    }

    /**
     * Log in to the application.
     * @param callback function(response,agent)
     */
    login(callback)
    {
        var agent = chai.request.agent(url());

        agent
            .get('login')
            .end(function(err,res)
            {
                // Parse the response and get the token value.
                var $ = cheerio.load(res.text);
                var token = $('input[name="_csrf"]').val();

                agent
                    .post('login')
                    .send({username: "admin@bom.us", password: "password", _csrf:token})
                    .then(function(res)
                    {
                        callback(res,agent);
                    })
            });
    }

    /**
     * Check if the response is a valid json with expected results.
     * @param response
     * @param expectedStatus
     * @param dataType
     */
    isJsonResponse(response, expectedStatus, dataType)
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
    request(verb,uri,data, agent)
    {
        var uri = _.trim(uri,"/");
        var req = agent ? agent[verb.toLowerCase()](uri) : chai.request(url()) [verb.toLowerCase()](uri);
        if (data) {
            req.send(data);
        }
        return req;
    };
}

TestKit.prototype.expressway = expressway;
TestKit.prototype.app = expressway.app;

module.exports = new TestKit;