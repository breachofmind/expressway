"use strict";

/**
 * Expressway MVC microframework
 * @author Mike Adamczyk <mike@bom.us>
 */

// Environment constants.
GLOBAL.ENV_LOCAL = 'local';
GLOBAL.ENV_DEV   = 'development';
GLOBAL.ENV_PROD  = 'production';
GLOBAL.ENV_CLI   = 'cli';
GLOBAL.ENV_TEST  = 'test';
GLOBAL.ENV_WEB   = [ENV_LOCAL,ENV_DEV,ENV_PROD,ENV_TEST];

var path        = require('path');
var Application = require('./src/Application');
var Provider    = require('./src/Provider');
var Driver      = require('./src/Driver');
var Model       = require('./src/Model');
var utils       = require('./src/support/utils');


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@          '@@+'''''''@@@@         '#@@@@@@@@@@@               @
//@         @@#'''''''''++'@@#  ;+@@@@@@@@@#####@@@              @
//@       '@@''''''''''''''''@@@@@@#''@@@########@@#             @
//@      #@#+'''''''''''''''@@@''''''@@############@             @
//@     #@++#''''''''''''+@@#'''''''@@#############@#            @
//@    ;@#++@''''''''''#@@+'''''''#@@@@@@@@######@@+             @
//@    @@+++#''''''''#@@''''''''+@@#@@@@@@@@@@##@@               @
//@   #@+++++@'''''@@@@#'''''#@@#         '@@@@@+                @
//@   @@+++++#+''#@@@@+#@@@@@+                @@@                @
//@   @+++++++@#@@@@;                           +@@              @
//@  ;@+++++++@@@@;                               +@+            @
//@  '@++++++@@@+       @@@@@@@@@@@@@@@@#           @@           @
//@  ;@+++++@@@       #@@`@@@@@@@@@@@@@@@@@+        ;;@#         @
//@   @++++#@@     '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@+  @
//@   @#+++@@  ,'@@@@@@+@@,...````````.'@@@@@@@@@@@@@@@@@@@@@#@  @
//@   @@++@@ '@@@@@@+   @@;```` +,`````+@@@@@@@@@@@@@@#@@@@@@@@  @
//@    @++@'+@@@@+      @@#```'@@@````.@@@@@@@@@@@@@@,``..`@+@@  @
//@    @@@@ @@#,        @@@.`.@.+@.````@@@@,;+##;, @@.``````@@#  @
//@    @@@+ @@          @@@```+  @`````@@@'@@@@@@@+@@..'```.@@'  @
//@    @@@, @@          ;@@;```@@.````;@@;@@;    #@@@ @@@```@@@  @
//@   #@@@  @#           @@@```..````.@@@,@@       @@'@ #;``@@,@ @
//@   @@@'  @#           #@@#.```````,@@@ @@+      ;@@' # ` @@ ;@@
//@   @@@,  @@            @@@#```````@@@  @@@@      @@` +`.@@+  @@
//@  @@@@   #@            '@@@@#,``,@@@@   @;#@@    @@@```'@@    @
//@ @@@@@@  ;@             #@@@@@@@@@@#    ;@;;@#  @'@@@@@@@     @
//@#@@@#@@@                 ;@@@@@@@@        @@;@ @# ;@@@@+      @
//@@@@@  @@@                                   #@##              @
//@@@@    @@#                                   +'               @
//@@@      @@'                                                   @
//@@+      ;@@                                                   @
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


/**
 * The Express MVC application.
 * @constructor
 */
class Expressway
{
    constructor(rootPath, config)
    {
        /**
         * The root path of the application.
         * @type {string}
         * @private
         */
        this._rootPath = rootPath;

        /**
         * The configuration file.
         * @type {{}}
         */
        this.config = config;

        /**
         * The default environment.
         * @type {string}
         */
        this.env = config.environment;

        /**
         * The Application instance.
         * @type {null|Application}
         */
        this.app = new Application(this);
    }

    /**
     * Get the root path to a file.
     * @param filepath string
     * @returns {string}
     */
    rootPath(filepath)
    {
        return path.normalize( this._rootPath + (filepath||"") );
    }

    /**
     * Bootstrap the application.
     * @returns {Application}
     */
    bootstrap()
    {
        return this.app.bootstrap();
    }

    /**
     * Initialize the application.
     * @param rootPath string
     * @param env string, optional
     * @returns {Expressway}
     */
    static init(rootPath,env)
    {
        var providers = utils.getModulesAsHash(__dirname+'/src/providers/', true);

        var config = require(rootPath + '/config/config') (providers);

        if (env) config.environment = env;

        return Expressway.instance = new Expressway(rootPath, config);
    }
}

Expressway.instance = null;
Expressway.BaseModel = Model;
Expressway.Provider = Provider;
Expressway.Driver = Driver;
Expressway.Application = Application;
Expressway.utils = utils;

module.exports = Expressway;