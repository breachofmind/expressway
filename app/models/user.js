var ExpressMVC = require('../../index');

var Auth = ExpressMVC.Auth;
var Model = ExpressMVC.Model;
var utils = ExpressMVC.utils;

var User = Model.create('User', {

    first_name:     String,
    last_name:      String,
    email:          String,
    password:       String,
    created_at:     { type: Date, default: Date.now },
    modified_at:    { type: Date, default: Date.now }

}).methods({

    /**
     * Checks the hashed password and salt.
     * @param password string
     * @returns {boolean}
     */
    isValid: function(password)
    {
        if (! password) {
            return false;
        }
        return this.password == Auth.encrypt(password,this.created_at.getTime().toString());
    },

    /**
     * Converts user to a JSON with password bumped off.
     * @returns {{}}
     */
    toJSON: function()
    {
        var out = utils.compact(this, ['_id','first_name','last_name','email','created_at','modified_at']);
        out['_url'] = utils.url(`api/v1/user/${this.id}`);
        return out;
    },

    /**
     * Return the user's full name.
     * @returns {string}
     */
    fullName: function()
    {
        return [this.first_name,this.last_name].join(" ");
    }

});

// Don't expose to API.
User.expose = false;