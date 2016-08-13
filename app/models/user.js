module.exports = function(Model,app)
{
    var User = Model.create('User', {

        email:          { type: String, required: true },
        password:       { type: String, required: true },
        first_name:     { type: String },
        last_name:      { type: String },
        roles: [
            { type:Model.types.ObjectId, ref:"Role" }
        ],
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

