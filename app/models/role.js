var _ = require('lodash');

module.exports = function(Model, app) {

    var Role = Model.create("Role", {
        created_at:     { type: Date, default: Date.now },
        modified_at:    { type: Date, default: Date.now },
        name:           { type: String, required:true, lowercase:true },
        description:    String,
        permissions:    [{
            type: Model.types.ObjectId, ref: "Permission"
        }]

    }).methods({

        /**
         * Assign a permission to this role.
         * @param permission Permission|array<Permission>
         * @return Promise
         */
        assign: function(permission)
        {
            this.permissions = this.permissions.concat(permissions);
            return this.save();
        },

        /**
         * Unassign a permission from this role.
         * @param permission Permission
         * @return Promise
         */
        unassign: function(permission)
        {
            this.permissions = _.filter(this.permissions, function(model) {
                return model.id != permission.id;
            });
            return this.save();
        }
    });

    Role.expose = false;

    return Role;
};