"use strict";

/**
 * Expressway MVC microframework
 * @author Mike Adamczyk <mike@bom.us>
 */

// Environment constants.
global.ENV_LOCAL = 'local';
global.ENV_DEV   = 'dev';
global.ENV_PROD  = 'prod';
global.ENV_ALL   = [ENV_LOCAL, ENV_DEV, ENV_PROD];

// Environment contexts.
global.CXT_CLI   = 'cli';
global.CXT_WEB   = 'web';
global.CXT_TEST  = 'test';
global.CXT_ALL   = [CXT_CLI,CXT_WEB,CXT_TEST];

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
    constructor(rootPath, config, context)
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
         * The environment context.
         * @type {string}
         */
        this.context = context || CXT_WEB;

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
        return Expressway.init(rootPath, CXT_CLI).bootstrap();
    }

    /**
     * Initialize the application.
     * @param rootPath string
     * @param context string, optional
     * @returns {Expressway}
     */
    static init(rootPath, context)
    {
        // Return the instance if it exists already.
        if (Expressway.instance) return Expressway.instance;

        var providers = utils.getModulesAsHash(__dirname+'/src/providers/', true);

        var config = require(rootPath + 'config/config') (providers);

        return Expressway.instance = new Expressway(rootPath, config, context);
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