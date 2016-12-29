"use strict";

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

require('./src/exceptions/ApplicationCallError');
require('./src/support/prototypes');