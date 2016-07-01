/**
 * Maintained controller that returns locale keys and values.
 * @param controller
 * @param app
 * @returns object
 */
module.exports = function(controller,app)
{
    var lang = app.locale;

    return {
        index: function(request,response)
        {
            if (app.environment === "prod") {
                response.setHeader('Cache-Control', 'public, max-age=' + 7*24*60*60);
            }
            var locale = request.locale.toLowerCase();

            return {
                locale: locale,
                keys: lang.getLocale(locale)
            };
        }
    }
};