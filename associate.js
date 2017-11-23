// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
// This particular shema fits the one that we are creating our client applicationCache.
// Just one thing:-
//  projectname can be a multiselect dropdown
//  manager can be a multiselct dropdown

var associateSchema = new Schema({
  empid:String,
  fullname:String,
  designation:String,
  startdate:String,
  enddate:String,
  projectname:[String],
  location:String,
  experience:String,
  manager:[String],
  competencies:[{competency:String,competencyexp:String,expertiselevel:String,pracexp:String,isPrimary:Boolean}],
  certifications:[{certification:String,aqdate:String}],
  country:String
  });

// the schema is useless so far
// we need to create a model using it
var Associate = mongoose.model('Associate', associateSchema);

// make this available to our users in our Node applications
module.exports = Associate;