var Expressway = require('expressway');
var cp = require('child_process');

var app = Expressway.init(__dirname + "/demo/app/").app;

app.bootstrap().server(function() {

    var url = app.get('url');
    // Boot google chrome if developing locally.
    if (app.env == ENV_LOCAL) {
        cp.exec(`open /Applications/Google\\ Chrome.app ${url()}`, function(err){});
    }
});
