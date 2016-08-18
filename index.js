"use strict";

/**
 * Express MVC
 * @author Mike Adamczyk <mike@bom.us>
 */

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@::::::::::'@@+'''''''@@@@:::::::::'#@@@@@@@@@@@:::::::::::::::@
//@:::::::::@@#'''''''''++'@@#::;+@@@@@@@@@#####@@@::::::::::::::@
//@:::::::'@@''''''''''''''''@@@@@@#''@@@########@@#:::::::::::::@
//@::::::#@#+'''''''''''''''@@@''''''@@############@:::::::::::::@
//@:::::#@++#''''''''''''+@@#'''''''@@#############@#::::::::::::@
//@::::;@#++@''''''''''#@@+'''''''#@@@@@@@@######@@+:::::::::::::@
//@::::@@+++#''''''''#@@''''''''+@@#@@@@@@@@@@##@@:::::::::::::::@
//@:::#@+++++@'''''@@@@#'''''#@@#:::::::::'@@@@@+::::::::::::::::@
//@:::@@+++++#+''#@@@@+#@@@@@+::::::::::::::::@@@::::::::::::::::@
//@:::@+++++++@#@@@@;:::::::::::::::::::::::::::+@@::::::::::::::@
//@::;@+++++++@@@@;:::::::::::::::::::::::::::::::+@+::::::::::::@
//@::'@++++++@@@+:::::::@@@@@@@@@@@@@@@@#:::::::::::@@:::::::::::@
//@::;@+++++@@@:::::::#@@`@@@@@@@@@@@@@@@@@+::::::::;;@#:::::::::@
//@:::@++++#@@:::::'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+::@
//@:::@#+++@@::,'@@@@@@+@@,...````````.'@@@@@@@@@@@@@@@@@@@@@#@::@
//@:::@@++@@:'@@@@@@+:::@@;````:+,`````+@@@@@@@@@@@@@@#@@@@@@@@::@
//@::::@++@'+@@@@+::::::@@#```'@@@````.@@@@@@@@@@@@@@,``..`@+@@::@
//@::::@@@@:@@#,::::::::@@@.`.@.+@.````@@@@,;+##;,:@@.``````@@#::@
//@::::@@@+:@@::::::::::@@@```+ :@`````@@@'@@@@@@@+@@..'```.@@'::@
//@::::@@@,:@@::::::::::;@@;```@@.````;@@;@@;::::#@@@:@@@```@@@::@
//@:::#@@@::@#:::::::::::@@@```..````.@@@,@@:::::::@@'@ #;``@@,@:@
//@:::@@@'::@#:::::::::::#@@#.```````,@@@:@@+::::::;@@' #:`:@@:;@@
//@:::@@@,::@@::::::::::::@@@#```````@@@::@@@@::::::@@`:+`.@@+::@@
//@::@@@@:::#@::::::::::::'@@@@#,``,@@@@:::@;#@@::::@@@```'@@::::@
//@:@@@@@@::;@:::::::::::::#@@@@@@@@@@#::::;@;;@#::@'@@@@@@@:::::@
//@#@@@#@@@:::::::::::::::::;@@@@@@@@::::::::@@;@:@#:;@@@@+::::::@
//@@@@@::@@@::::::::::::::::::::;::::::::::::::#@##::::,,::::::::@
//@@@@::::@@#:::::::::::::::::::::::::::::::::::+':::::::::::::::@
//@@@::::::@@':::::::::::::::::::::::::::::::::::::::::::::::::::@
//@@+::::::;@@:::::::::::::::::::::::::::::::::::::::::::::::::::@
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


var Application = require('./src/application');

var Provider = require('./src/provider');

var applicationProviders = {};
[
    'logger',
    'url',
    'cli',
    'seeder',
    'database',
    'auth',
    'controller',
    'controllerDefaults',
    'model',
    'template',
    'view',
    'locale',
    'express',
    'router',
    'gate'

].map(function(name) {
    applicationProviders[name] = require('./src/providers/' + name);
});

/**
 * The Express MVC application.
 * @type {{}}
 */
module.exports = {

    /**
     * The Application class.
     * @type Application
     */
    Application: Application,

    /**
     * The Provider class.
     * @type Provider
     */
    Provider: Provider,

    /**
     * System providers to use in your application.
     * Or, substitute with your own.
     * @type object
     */
    Providers: applicationProviders,

    /**
     * Initialize the application and bootstrap.
     * @param rootPath string
     * @param env string, optional
     * @returns {Application}
     */
    init: function(rootPath,env)
    {
        Application.setRootPath(rootPath);

        var config = require (Application.rootPath('config/config')) (applicationProviders);

        Provider.modules(config.providers);

        return Application.create(config,env).bootstrap();
    }
};