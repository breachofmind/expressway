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

/**
 * The expressway init function.
 * @param opts object
 * @returns {Application}
 */
function expressway(opts={})
{
    if (! opts.config) {
        throw new TypeError('config is required');
    }
    if (! opts.rootPath) opts.rootPath = path.dirname(process.argv[1]);
    if (! opts.context) opts.context = CXT_WEB;

    if (opts.context == CXT_TEST) {
        global.chai     = require('chai');
        global.chaiHttp = require('chai-http');
        global.expect   = chai.expect;
        global.should   = chai.should();
        chai.use(global.chaiHttp);
    }

    // Merge all configurations into one config object.
    var config = _.assign({},...([].concat(opts.config)));

    var app = new Application(opts.rootPath,config,opts.context);

    if (opts.middleware) {
        opts.middleware.forEach(fn => {
            app.middleware.add(fn);
        })
    }
    if (opts.controllers) {
        opts.controllers.forEach(fn => {
            app.controllers.add(fn);
        })
    }

    if (opts.localePath) {
        app.get('locale').addDirectory(opts.localePath);
    }

    return app;
}

expressway.Controller = require('./src/Controller');
expressway.Middleware = require('./src/Middleware');
expressway.Extension  = require('./src/Extension');
expressway.Provider   = require('./src/Provider');
expressway.Model      = require('./src/Model');

module.exports = expressway;