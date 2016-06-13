

module.exports = function(request)
{
    var locale = request.locale;

    return function(key) {
        return key;
    }
};