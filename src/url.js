module.exports = function UrlProvider(app)
{
    var config = app.config;

    var baseurl = config.proxy ? config.proxy : config.url + ":" +config.port;

    app.logger.debug('Base URL: %s', baseurl);

    /**
     * Return a url to the given path.
     * @return string
     */
    return function Url(uri)
    {
        if (!uri) uri = "";
        return `${baseurl}/${uri}`;
    }
};