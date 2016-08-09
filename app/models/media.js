module.exports = function(Factory,app)
{
    var url = app.utils.url;

    var Media = Factory.create('Media', {
        file_name:      { type: String, required:true},
        file_type:      { type: String, required:true },
        title:          String,
        meta:           Factory.types.Mixed,
        occurred_at:    { type: Date, default: Date.now },
        created_at:     { type: Date, default: Date.now },
        modified_at:    { type: Date, default: Date.now }

    }).methods({
        path: function()
        {
            return url(this.file_name);
        }
    }).appends('path');
};
