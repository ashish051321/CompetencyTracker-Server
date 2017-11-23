// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var certificationSchema = new Schema({
    certificationName: String
});

// the schema is useless so far
// we need to create a model using it
var Certification = mongoose.model('Certification', certificationSchema);

// make this available to our users in our Node applications
module.exports = Certification;