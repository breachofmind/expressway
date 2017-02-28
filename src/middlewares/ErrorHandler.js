"use strict";

var Middleware  = require('../Middleware');
var stackParser = require('error-stack-parser');
var path        = require('path');
var fs          = require('fs');
var readline    = require('readline');
var Promise     = require('bluebird');
var ejs         = require('ejs');
var _           = require("lodash");

/**
 * The default 500 error handler.
 */
class ErrorHandler extends Middleware
{
    get description() {
        return "The default server error handler middleware";
    }

    constructor(app)
    {
        super(app);

        let templateFile = path.resolve(__dirname, '../templates/error.html.ejs');

        /**
         * The default error template.
         * @type {*}
         */
        this.template = ejs.compile(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    }

    /**
     * @injectable
     * @param extension Extension
     * @param config Function
     * @returns {ErrorHandler}
     */
    dispatch(extension, config, log)
    {
        let errorTemplate = this.template;

        return function ErrorHandler(err,request,response,next)
        {
            if (response.headersSent) {
                return next(err);
            }
            let thrown = err instanceof ApplicationCallError ? err.thrown : err;
            let layers = stackParser.parse(thrown);
            let topLayer = layers[0];

            response.status(thrown instanceof NotFoundException ? 404 : 500);

            log.error(err.message);

            getCode(topLayer).then(code =>
            {
                let data = {
                    extension: extension.name,
                    error: err,
                    message: err.message,
                    instigator: topLayer,
                    stack: layers,
                    startLine: code[0].lineNumber,
                    code: code.toString(),
                    debug: config('debug'),
                    admin: config('admin', 'info@localhost')
                };

                if (request.xhr) {
                    return response.smart(data, response.statusCode);
                }

                // The extension developer can specify their own error handlers.
                if (extension.errorPage) {
                    response.view
                        .title("Error")
                        .template(extension.errorPage)
                        .use(data);
                    return response.smart(response.view, response.statusCode);
                }

                // Use the default error handler page.
                return response.smart(errorTemplate(_.assign({request: request},data)), response.statusCode);
            });
        }
    }
}

/**
 * A function for returning a portion of a file, given the error stack layer.
 * @param layer {Layer}
 * @returns {Promise}
 */
function getCode(layer)
{
    const line = layer.lineNumber;
    const start = line - 5 < 1 ? 1 : line-5;
    const end = line + 5;
    let cursor = 1;
    let output = [];

    output.toString = function()
    {
        return this.map(ln => { return ln.code }).join("\n").trim();
    };

    const rl = readline.createInterface({
        input: fs.createReadStream(layer.fileName)
    });

    return new Promise(resolve =>
    {
        rl.on('line', (code) => {
            if (cursor > end) return rl.close();
            if (cursor >= start && cursor <= end) {
                output.push({lineNumber:cursor, code:code});
            }

            cursor++;
        });

        rl.on('close', () => {
            resolve(output);
        });
    });
}

module.exports = ErrorHandler;

