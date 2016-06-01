var ExpressMVC = require('./index');

ExpressMVC.Application.root = __dirname + "/app/";

var app = ExpressMVC.Application.create();

app.bootstrap().server();