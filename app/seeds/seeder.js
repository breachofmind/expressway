var ExpressMVC = require('../index');

ExpressMVC.Application.root = __dirname+"/../";

// Different seeder names can be created.
var seeder = new ExpressMVC.Seeder('installation');

// The root path where all your seed .csv files are stored.
seeder.seedPath = __dirname + "/seeds/";

/**
 * Create a new model to seed using the seeder.add() method.
 * @param name string of seed
 * @param path string of seed, relative to seeder.seedPath
 * @param parser function, optional
 */
seeder.add('media', 'media.csv');

seeder.add('user', 'users.csv', function(row,i)
{
    // Each user row is parsed before a model is created.
    // In this case, we're creating a salted password.
    row.created_at = new Date();
    var salt = row.created_at.getTime().toString();
    row.password = ExpressMVC.Auth.encrypt(row.password,salt);

    return row;
});

/**
 * A callback is required when all the CSV files are processed.
 * Then, you can start persisting the models to the database.
 */
seeder.on('done', function(seeds)
{
    seeder.createModels();
});

// Start the seeding process.
// When finished, the script will end.
seeder.seed();