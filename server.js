var mvc = require('./index');
var cp = require('child_process');

var app = mvc.init(__dirname + "/demo/app/");

app.bootstrap().server(function() {

    // Boot google chrome if developing locally.
    if (app.env == ENV_LOCAL) {
        cp.exec(`open /Applications/Google\\ Chrome.app ${app.url()}`, function(err){});
    }
});
