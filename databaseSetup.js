//Import the mongoose module
var mongoose = require('mongoose');

var DatabaseSetup = function (mongoDbUrl) {
    
    mongoose.connect(mongoDbUrl);

    //Get the default connection
    var db = mongoose.connection;

    //Bind connection to error event (to get notification of connection errors)
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));

};

module.exports = DatabaseSetup;