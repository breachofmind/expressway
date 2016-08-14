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
        user: seeder.add('user', 'users.csv'),
        permissions: seeder.add('permission', permissions, function(row,i) {
            roles[0].permissions.push(row._id);
            return row;
        }),
        roles: seeder.add('role', roles)
    };

    seeder.run().then(function(){

        seeder.get('user').data[0].roles = [
            seeder.get('role').data[0]._id
        ];


        seeder.seed().then(function(){

            app.logger.info('[Seeder] Done seeding.');
            process.exit();
        })
    })

};