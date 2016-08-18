var test = require('unit.js'),
    should = require('should'),
    assert = require('assert'),
    request = require('supertest');

var ExpressMVC = require('../index');

var app = ExpressMVC.Application.create();
var config = app.config;

/**
 * Test the application configuration.
 */
describe('configuration', function()
{
    it('is an object', function(){
        test.object(config);
    });
    it('has valid port', function(){
        test.number(config.port)
            .isBetween(1,9000);
    });
    it('has correct env', function(){
        test.string(app.environment)
            .match((it)=> {
                return it==="local" || it==="uat" || it==="prod" || it==="sit";
            })
    })
});

/**
 * Test the application core.
 */
describe('application', function()
{
    it('bootstraps', function(){
        test.object(app);
    })
});


describe('template', function()
{
    var template = ExpressMVC.Template.create('New title');

    it('is constructor and instance', function(){
        test.function(ExpressMVC.Template).hasName('Template');
        test.object(template).isInstanceOf(ExpressMVC.Template);
    });
    it('constructor sets title', function(){
        test.string(template.title).is('New title');
    });
    it('generates head string', function(){
        test.string(template.head()).isNotEmpty();
    })
});



describe('controller', function()
{
    /**
     * The controller action to test.
     * @param controller
     * @returns {{index: index, object: Object}}
     */
    var ctrl = function(controller)  {

        // For testing purposes
        if (controller) {
            controller.bind('id', function(value, request,response) {
                request.params.id = "new-"+value;
            });
        }


        return {
            index: function (request,response,next) {
                return "String";
            },

            object: function(request,response,next) {
                return {object:"Object"};
            }
        }
    };


    var instance = ExpressMVC.Controller.create('testController', ctrl);

    it('is constructor', function(){
        test.function(ExpressMVC.Controller).hasName('ControllerFactory');
    });
    it('is instance', function(){
        test.object(instance).isInstanceOf(ExpressMVC.Controller);
        test.object(ExpressMVC.Controller.find('testController')).isIdenticalTo(instance);
        test.value(ExpressMVC.Controller.find('NotThereController')).is(null);
    });
    it('removes construct method', function(){
        test.bool(instance.has('construct')).isFalse();
        test.function(instance.use('construct')).hasName('errorMethod');
    });
    it('binds parameters', function(){
        test.object(instance._bindings);
        test.function(instance._bindings['id']);
    });
    it('attaches methods', function(){
        test.bool(instance.has('index')).isTrue();
        test.function(ExpressMVC.Controller.find('testController').methods['index']).isIdenticalTo(instance.use('index'));
    })
});