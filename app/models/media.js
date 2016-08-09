var ExpressMVC = require('../../index');
var Model = ExpressMVC.Model;
var url = ExpressMVC.utils.url;

Model.create('Media', {
    file_name:      { type: String, required:true},
    file_type:      { type: String, required:true },
    title:          String,
    meta:           Model.types.Mixed,
    occurred_at:    { type: Date, default: Date.now },
    created_at:     { type: Date, default: Date.now },
    modified_at:    { type: Date, default: Date.now }

}).methods({
    path: function()
    {
        return url(this.file_name);
    }
}).appends('path');