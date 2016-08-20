var ExpressMVC = require('../index');

GLOBAL.chai = require('chai');
GLOBAL.chaiHttp = require('chai-http');
GLOBAL.expect = chai.expect;
GLOBAL.should = chai.should();

GLOBAL.chai.use(GLOBAL.chaiHttp);

ExpressMVC.testRootPath = __dirname+"/../app/";
ExpressMVC.testApp = ExpressMVC.init(ExpressMVC.testRootPath, ENV_TEST);

module.exports = ExpressMVC;