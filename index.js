"use strict";

/**
 * Expressway MVC microframework
 * @author Mike Adamczyk <mike@bom.us>
 */
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
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

require('./globals');

var _           = require('lodash');
var path        = require('path');
var Application = require('./src/Application');

var defaultConfig = {
    env: ENV_LOCAL,
    url: "http://localhost",
    appKey: "basic",
    port: 8081,
    debug:true,
    paths: {
        tmp: "./tmp",
        logs: "./tmp/logs",
        views: "./resources/views",
        locales: "./resources/locale",
        resources: "./resources",
        config: "./config",
        models: "./app/models",
        controllers: "./app/controllers",
        middleware: "./app/middlewares",
        providers: "./app/providers",
        services: "./app/services",
        components: "./app/components",
        uploads: "./public/uploads",
        public: "./public",
        db: "./app/db",
    }
};

/**
 * The expressway init function.
 * @param opts object
 * @returns {Application}
 */
function expressway(opts={})
{
    opts.rootPath = opts.rootPath || path.dirname(process.argv[1]);
    opts.context = opts.context || EXPRESSWAY_CONTEXT;

    if (opts.context == CXT_TEST) testing();

    // Merge all configurations into one config object.
    var config = _.assign({},defaultConfig,...([].concat(opts.config)));

    return new Application(opts.rootPath,config,opts.context);
}

/**
 * Globals to create when testing.
 * @returns void
 */
function testing()
{
    global.chai     = require('chai');
    global.chaiHttp = require('chai-http');
    global.expect   = chai.expect;
    global.should   = chai.should();
    chai.use(global.chaiHttp);
}

expressway.Promise    = require('bluebird');
expressway.Controller = require('./src/Controller');
expressway.Middleware = require('./src/Middleware');
expressway.Extension  = require('./src/Extension');
expressway.Provider   = require('./src/Provider');
expressway.Model      = require('./src/Model');
expressway.Driver     = require('./src/Driver');

module.exports = expressway;