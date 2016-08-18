"use strict";

module.exports = function(Provider)
{
    Provider.create('templateDefaults', function() {

        // Provider setup...
        this.requires(['templateProvider']);

        // Return the registration function...
        return function(app){

            app.Template.defaults = function(view)
            {
                this.style('foundation', "https://cdnjs.cloudflare.com/ajax/libs/foundation/6.2.3/foundation-flex.min.css");
                this.meta('viewport','width=device-width');
            };
        }
    });
};