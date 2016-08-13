module.exports = function(Seeder,app)
{
    var seeder = Seeder.create('installation');

    var roles = [{
        name: 'superuser',
        description: "Has system-wide permissions.",
        permissions: []
    }];
    var models = ['media','user'];
    var methods = ['create','read','update','delete'];
    var permissions = [];
    models.forEach(function(model) {
        methods.forEach(function(method) {
            permissions.push({object:model, method:method})
        })
    });

    var seeds = {
        media:       seeder.add('media', 'media.csv'),
        users:       seeder.add('user', 'users.csv'),
        permissions: seeder.add('permission', permissions, function(row,i) {
            roles[0].permissions.push(row._id);
            return row;
        }),
        roles:       seeder.add('role', roles)
    };

    seeder.run().then(function(){

        seeds.media.reset = true;
        seeds.users.reset = true;
        seeds.permissions.reset = true;

        seeder.seed().then(function(){

            app.logger.info('[Seeder] Done seeding.');
            process.exit();
        })
    })

};