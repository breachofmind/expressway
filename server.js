var ExpressMVC = require('./index');

var app = ExpressMVC.Application.create();

app.bootstrap().server();