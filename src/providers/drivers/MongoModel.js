"use strict";

var Expressway  = require('expressway');
var app         = Expressway.instance.app;
var url         = app.get('url');
var db          = app.get('db');
var driver      = app.get('DriverProvider');

/**
 * The mongodb model.
 * @author Mike Adamczyk <mike@bom.us>
 */
class MongoModel extends Expressway.BaseModel
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);
        this.Types = db.Schema.Types;
    }

    get(args) {
        return this.model.find(args).populate(this.populate).sort(this.range).exec().then(function(modelArray) {
            return this.collection(modelArray);
        }.bind(this));
    }

    find(args) {
        return this.model.find(args).populate(this.populate).sort(this.range);
    }

    findOne(args) {
        return this.model.findOne(args);
    }

    findById(id) {
        return this.model.findById(id).populate(this.populate);
    }

    findByIdAndUpdate(id,data,args)
    {
        return this.model.apply(this._model,arguments);
    }

    count(args) {
        return this.model.count(args);
    }

    remove(args) {
        return this.model.remove(args);
    }

    create(args) {
        return this.model.create(args);
    }

    update(args) {
        return this.model.update(args);
    }

    /**
     * Method that allows editing of the Schema
     * before being attached to the model.
     * @param Schema
     * @returns {null}
     */
    onBoot(Schema) {}

    /**
     * When booting, create the database model for mongoose.
     * @returns boolean
     */
    boot()
    {
        var schema = new db.Schema(this.schema, {collection: this.table});
        this.onBoot(schema);
        this.schema.methods = this.methods;
        this.model = db.model(this.name, schema);

        return super.boot();
    }
}

module.exports = MongoModel;