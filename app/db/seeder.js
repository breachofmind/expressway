module.exports = function(Seeder,app)
{
    var seeder = Seeder.create('installation');

    seeder.reset = true;

    var roles = [{
        name: 'superuser',
        description: "Has system-wide permissions.",
        permissions: []
    }];
    var models = ['User','Role'];
    var methods = ['create','read','update','delete'];
    var permissions = [];
    models.forEach(function(model) {
        methods.forEach(function(method) {
            permissions.push({object:model, method:method})
        })
    });

    var seeds = {
        user: seeder.add('User', 'users.csv'),
        permissions: seeder.add('Permission', permissions, function(row,i) {
            roles[0].permissions.push(row._id);
            return row;
        }),
        roles:       seeder.add('Role', roles)
    };

    seeder.run().then(function(){

        seeder.seed().then(function(){

            app.logger.info('[Seeder] Done seeding.');
            process.exit();
        })
    })

};