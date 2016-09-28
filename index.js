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
var Application = require('./src/application');
var Provider    = require('./src/provider');
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
    constructor()
    {
        /**
         * The root path of the application.
         * @type {string}
         * @private
         */
        this._rootPath = __dirname + "/app/";

        /**
         * The configuration file.
         * @type {{}}
         */
        this.config = {};

        this.env = null;

        /**
         * The Application instance.
         * @type {null|Application}
         */
        this.app = null;

        Object.defineProperties(this, {
            Application : { enumerable: true, value: Application },
            Provider :    { enumerable: true, value: Provider },
            utils :       { enumerable: true, value: utils },
        })
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
     * Set the root path of the application.
     * @param value {string}
     * @returns {Expressway}
     */
    setRootPath(value) {
        this._rootPath = path.normalize(value);
        return this;
    }

    /**
     * Initialize the application and bootstrap.
     * @param rootPath string
     * @param env string, optional
     * @returns {Application}
     */
    init(rootPath,env)
    {
        this.setRootPath(rootPath);

        utils.getModules(__dirname+'/src/providers/', true);
        utils.getModules(__dirname+'/src/drivers/', true);

        this.config = require(this.rootPath('config/config')) (Provider.get());

        this.env = env || this.config.environment;

        return this.app = new Application(this);
    }
}

module.exports = new Expressway();