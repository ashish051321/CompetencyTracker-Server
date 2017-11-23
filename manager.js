// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var managerSchema = new Schema({
    managerName: String
});

// the schema is useless so far
// we need to create a model using it
var Manager = mongoose.model('Manager', managerSchema);

// make this available to our users in our Node applications
module.exports = Manager;