// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var competencySchema = new Schema({
    competencyName: String
});

// the schema is useless so far
// we need to create a model using it
var Competency = mongoose.model('Competency', competencySchema);

// make this available to our users in our Node applications
module.exports = Competency;