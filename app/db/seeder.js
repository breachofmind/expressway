module.exports = function(Seeder,app)
{
    var seeder = Seeder.create('installation');

    seeder.add('media', 'media.csv');
    seeder.add('user', 'users.csv', userParser);


    function userParser(row,i)
    {
        row.created_at = new Date();
        var salt = row.created_at.getTime().toString();
        row.password = app.Auth.encrypt(row.password,salt);

        return row;
    }

    seeder.run().then(function(){

        seeder.get('media').reset = true;
        seeder.get('user').reset = true;

        seeder.seed().then(function(){

            process.exit();
        })
    })

};