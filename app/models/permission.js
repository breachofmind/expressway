module.exports = function(Model, app) {

    var Permission = Model.create("Permission", {
        created_at:     { type: Date, default: Date.now },
        modified_at:    { type: Date, default: Date.now },
        object:         { type: String, required:true },
        method:         { type: String, required:true },

    }).methods({
        // Model methods.
    });

    Permission.expose = false;

    return Permission;
};