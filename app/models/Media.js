var ExpressMVC = require('../../index');

module.exports = ExpressMVC.Model.create('Media', function Blueprint(app)
{
    this.title      = 'title';
    this.expose     = true;
    this.guarded    = [];
    this.appends    = [];
    this.labels     = {
        title:     "Title",
        file_name: "File Name",
        file_type: "File Type",
        alt_text:  "Alt Text",
        caption:   "Caption"
    };
    this.populate   = [];

    this.schema = {
        title:       { type: String, required: true },
        file_name:   { type: String, required: true },
        file_type:   { type: String, required: true },
        alt_text:    { type: String },
        caption:     { type: String },
        etag:        { type: String },
        created_at:  { type: Date, default: Date.now },
        modified_at: { type: Date, default: Date.now }
    };

    this.methods = {}

});