var _ = require('lodash');
var Model = require('../../index').Model;

module.exports = Model.create('Role', function Blueprint(app)
{
    this.title = 'name';
    this.expose = false;
    this.guarded = [];
    this.appends = [];
    this.labels = {};

    // Set the schema for this model.
    this.schema = {
        name:        { type: String, required: true },
        description: { type: String },
        permissions: [{ type: Model.types.ObjectId, ref: "Permission" }],
        created_at:  { type: Date, default: Date.now },
        modified_at: { type: Date, default: Date.now }
    };

    this.populate = ['permissions'];

    // Set the model methods.
    this.methods = {
        assign: function (permission)
        {
            this.permissions = this.permissions.push(permission);
            this.save();
        },

        unassign: function(permission)
        {
            this.permissions = _.filter(this.permissions, function(model) {
                return model.id != permission.id;
            });
            this.save();
        }
    }
});