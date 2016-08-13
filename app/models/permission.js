module.exports = function(Model, app) {

    return Model.create("Permission", function Blueprint()
    {
        this.title = 'name';
        this.expose = false;

        // Set the schema for this model.
        this.schema = {
            object: { type: String, required:true },
            method: { type: String, required:true },
        };

        // Set the model methods.
        this.methods = {}
    });
};