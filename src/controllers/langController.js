/**
 * Maintained controller that returns locale keys and values.
 * @param app
 * @returns object
 */
module.exports = function(app)
{
    return {
        index: function(request,response)
        {
            if (app.environment === "prod") {
                response.setHeader('Cache-Control', 'public, max-age=' + 7*24*60*60);
            }
            var locale = request.locale.toLowerCase();

            return {
                locale: locale,
                keys: app.locale.getLocale(locale)
            };
        }
    }
};