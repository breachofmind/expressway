module.exports = function(Factory,app)
{
    var User = Factory.create('User', {

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
                return this.password === app.Auth.encrypt(password,this.created_at.getTime().toString());
            },

            /**
             * Return the user's full name.
             * @returns {string}
             */
            name: function()
            {
                return [this.first_name,this.last_name].join(" ");
            },

            /**
             * Check if a user can perform an action.
             * @param object string
             * @param method string
             * @returns {*}
             */
            can: function(object,method)
            {
                if (! app.gate) return true;

                return app.gate.check(this,object,method);
            }

        })
        .guard('password')
        .appends('name');


    User.schema.pre('save', function(next) {

        this.password = app.Auth.encrypt(this.password, this.created_at.getTime().toString());
        next();
    });

    User.title = "name";

    // Don't expose to API.
    User.expose = false;

    return User;
};

