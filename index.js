"use strict";

/**
 * Expressway MVC microframework
 * @author Mike Adamczyk <mike@bom.us>
 */

// Environment constants.
global.ENV_LOCAL = 'local';
global.ENV_DEV   = 'development';
global.ENV_PROD  = 'production';
global.ENV_CLI   = 'cli';
global.ENV_TEST  = 'test';
global.ENV_WEB   = [ENV_LOCAL,ENV_DEV,ENV_PROD,ENV_TEST];

var path            = require('path');
var Application     = require('./src/Application');
var Provider        = require('./src/Provider');
var DriverProvider  = require('./src/DriverProvider');
var Model           = require('./src/Model');
var utils           = require('./src/support/utils');
var GulpBuilder     = require('./src/support/GulpBuilder');


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
     * An alias to the CLI environment.
     * @param rootPath string
     * @returns {Application}
     */
    static cli(rootPath)
    {
        return Expressway.init(rootPath, ENV_CLI).bootstrap();
    }

    /**
     * Initialize the application.
     * @param rootPath string
     * @param env string, optional
     * @returns {Expressway}
     */
    static init(rootPath,env)
    {
        // Return the instance if it exists already.
        if (Expressway.instance) return Expressway.instance;

        var providers = utils.getModulesAsHash(__dirname+'/src/providers/', true);

        var config = require(rootPath + 'config/config') (providers);

        if (env) config.environment = env;

        return Expressway.instance = new Expressway(rootPath, config);
    }
}

Expressway.instance         = null;
Expressway.BaseModel        = Model;
Expressway.Provider         = Provider;
Expressway.DriverProvider   = DriverProvider;
Expressway.Application      = Application;
Expressway.utils            = utils;
Expressway.GulpBuilder      = GulpBuilder;

module.exports = Expressway;