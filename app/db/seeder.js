module.exports = function(Seeder,app)
{
    var seeder = Seeder.create('installation');

    seeder.add('media', 'media.csv');
    seeder.add('user', 'users.csv');


    seeder.run().then(function(){

        seeder.get('media').reset = true;
        seeder.get('user').reset = true;

        seeder.seed().then(function(){

            process.exit();
        })
    })

};