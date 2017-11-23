const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const http = require('http');
var formidable = require('formidable');
var DatabaseSetup = require("./databaseSetup");

var Associate = require('./associate');
var Project = require('./project');
var Manager = require('./manager');
var Certification = require('./certification');
var Competency = require('./competency');

var favicon = require('serve-favicon') //to solve the chrome infinite loop problem of trying to fetch favicon.
XLSX = require('xlsx');
var workbook = null;
var mongoDbUrl = 'mongodb://127.0.0.1/ctdb';
DatabaseSetup(mongoDbUrl); //creating a connection with MongoDB, based on the URL

// The util module is primarily designed to support the needs of Node.js' own
// internal APIs. However, many of the utilities are useful for application
// and module developers as well. It can be accessed using:
const util = require('util');
const app = express(); //this is the start of use of express framework



// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


//Body Parser Middleware
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));


app.post('/insertAssociate', function (req, res) {

    console.log("insertAssociate was called");
    console.log(req.body.empid);;
    console.log(req.body.fullname);;
    console.log("-----------");
    //First Checking if an associate is already present in the database
    Associate.find({
        empid: req.body.empid
    }, function (err, user) {
        if (err) {
            console.log(err);
            res.send({
                "msg": "There was a database error updating: " + req.body.fullname + ". Please connect with the IT Team to get this fixed."
            });
        }
        console.log(user); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (user.length != 0) {
            Associate.findOneAndRemove({
                empid: req.body.empid
            }, function (err, user) {
                if (err) throw err;
                console.log("Deleted--");
                console.log(user);
                var newAssociate = new Associate(req.body);
                newAssociate.save(function (err) {
                    if (err) throw err;
                    console.log('Associate saved successfully !!!!');
                    res.send({
                        "msg": "Record Updated for: " + req.body.fullname
                    });
                });
            });
        } else {
            //In any case Saving to MongoDB through Mongoose Object-Document-Mapping.--------
            var newAssociate = new Associate(req.body);
            newAssociate.save(function (err) {
                if (err) throw err;
                console.log('Associate saved successfully !!!!');
                res.send({
                    "msg": "Record Updated for: " + req.body.fullname
                });
            });

        }

    });

});

//******************************************************************************* */
// http://localhost:9500/getassociate?empid=788548 will get us a record from MongoDB
app.get('/getassociate', function (req, res) {

    Associate.find({
        empid: req.query.empid
    }, function (err, user) {
        if (err) {
            res.send(err);
        }
        console.log(user);
        res.json(user);

    });



}); // getassociate ends

//******************************************************************************* */
//very simple, we have removed the criteria and we are getting all the associates.

app.get('/getallassociates', function (req, res) {

    Associate.find(function (err, user) {
        if (err) {
            res.send(err);
        }
        // console.log(user);//here we are getting an array of objects. Thanks Mongoose :)
        res.json(user);

    });

}); // getallassociates ends

//******************************************************************************* */
//Implementing the delete associate functionality as well, using the get method.
// You can finda fruitful dicussion on  Mongoose remove operations here at:-
// https://stackoverflow.com/questions/5809788/how-do-i-remove-documents-using-node-js-mongoose

app.get('/deleteassociate', function (req, res) {
    Associate.findOneAndRemove({
        empid: req.query.empid
    }, function (err, user) {
        if (err) {
            res.send({
                "msg": "There was a database error deleting: " + req.query.empid + ". Please connect with the IT Team to get this fixed."
            });

            throw err;
        }
        console.log("Deleted--");
        console.log(user);
        res.send({
            "msg": "Record Updated for: " + req.query.empid
        });

    });

}); // getallassociates ends


app.post('/bulkupload', function (req, res) {


    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = false;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
        console.log("File Saved: " + file.name);
        setTimeout(function () {
            readExcel(file.name);
        }, 2000);
    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);
    res.status(200).send("yay");

});


//-------------------------------------------------------------------------

app.listen(9500, function () {
    console.log('Express app listening on port 9500!');
});

/* --------------------------------------------------------------------------------- */

function readExcel(filename) {
    var wb = XLSX.readFile('uploads/' + filename);
    /* generate array of arrays */
    //    data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1,range:3,"defval":"XXXXX"});//the data starts from row number 3
    data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        raw: true,
        "defval": 'XXXXX'
    }); //the data starts from row number 3
    // console.log(data.length);

    //iterating over all the entries in the table and then will pass object to database insert function.
    for (var i = 2; i < data.length; i++) {
        var entry = data[i];
        //Creating an object:-

        var tempObj = {
            empid: entry.empid.toString().trim(),
            fullname: entry.fullname.toString().trim()
        };

        //If present in Excel then only insert else, dont even create the field.

        (entry.designation != 'XXXXX') ? tempObj.designation = entry.designation.toString().trim() : void (0);
        (entry.startdate != 'XXXXX') ? tempObj.startdate = entry.startdate.toString().trim() : void (0);
        (entry.enddate != 'XXXXX') ? tempObj.enddate = entry.enddate.toString().trim() : void (0);
        (entry.projectname != 'XXXXX') ? tempObj.projectname = [entry.projectname.toString().trim()] : void (0);
        (entry.location != 'XXXXX') ? tempObj.location = entry.location.toString().trim() : void (0);
        (entry.manager != 'XXXXX') ? tempObj.manager = [entry.manager.toString().trim()] : void (0);
        (entry.country != 'XXXXX') ? tempObj.country = entry.country.toString().trim() : void (0);

        if (entry.comp_name != "XXXXX") {
            tempObj.competencies = [{
                competency: entry.comp_name.toString().trim(),
                competencyexp: entry.comp_exp.toString().trim(),
                expertiselevel: entry.comp_exprt.toString().trim(),
                pracexp: entry.comp_prac_exp.toString().trim(),
                isPrimary: true
            }];
        }

        if (entry.cert_name != "XXXXX") {
            tempObj.certifications = [{
                certification: entry.cert_name.toString().trim(),
                aqdate: entry.cert_acquired_date.toString().trim()
            }];
        }

        //send for insertion into database
        insertIntoDatabase(tempObj);

    } //for loop iterating over all entries in excel - Ends


} //readExcel function ends



/* --------------------------------------------------------------------------------- */

function insertIntoDatabase(associate) //this is an object with all the fields as requried in Associate schema
{
    //before inserting we just need to check if the empid is already present in the database.
    // if empid is already present, then the entry is skipped.
    Associate.find({
        empid: associate.empid
    }, function (err, docs) {
        if (docs.length) {
            console.log("Name exists already");
        } else { //save the associate
            var newAssociate = new Associate(associate);
            newAssociate.save(function (err) {
                if (err) throw err;
                console.log('Associate saved successfully !!!!');
            });

        }
    });


} //insertIntoDatabase function ends



/* --------------------------------------------------------------------------------- */

//Competencies related operations- creation of competencies -- see all comp--  deletion of competencies

app.post('/insertcomp', function (req, res) {
    console.log(req.body);

    Competency.find({
        competencyName: req.body.competencyName
    }, function (err, compList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(compList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (compList.length != 0) {
            Competency.findOneAndRemove({
                competencyName: req.body.competencyName
            }, function (err, compList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(compList);
            });
        }

        //In any case Saving to MongoDB through Mongoose Object-Document-Mapping.--------
        var newCompetency = new Competency(req.body);
        newCompetency.save(function (err) {
            if (err) throw err;
            console.log('Competency saved successfully !!!!');
            res.send({
                "msg": "Record Updated for: " + req.body.competencyName
            });
        });



    });


});

app.post('/deletecomp', function (req, res) {

    Competency.find({
        competencyName: req.body.competencyName
    }, function (err, compList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(compList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (compList.length != 0) {
            Competency.findOneAndRemove({
                competencyName: req.body.competencyName
            }, function (err, compList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(compList);
                res.send({
                    "msg": "Record deleted for: " + req.body.competencyName
                });

            });
        }
        else {
            res.send({
                "msg": "Record not found for: " + req.body.competencyName
            });

        }

    });


});

/* --------------------------------------------------------------- */

app.get('/getallcomps', function (req, res) {

    Competency.find(function (err, user) {
        if (err) {
            res.send(err);
        }
        // console.log(user);//here we are getting an array of objects. Thanks Mongoose :)
        res.json(user);

    });


});
//getallcomps ends

/* --------------------------------------------------------------- */

//Projects related operations

/* --------------------------------------------------------------------------------- */



app.post('/insertproj', function (req, res) {
    console.log(req.body);

    Project.find({
        projectName: req.body.projectName
    }, function (err, projList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(projList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (projList.length != 0) {
            Project.findOneAndRemove({
                projectName: req.body.projectName
            }, function (err, projList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(projList);
            });
        }

        //In any case Saving to MongoDB through Mongoose Object-Document-Mapping.--------
        var newProject = new Project(req.body);
        newProject.save(function (err) {
            if (err) throw err;
            console.log('Project saved successfully !!!!');
            res.send({
                "msg": "Record Updated for: " + req.body.projectName
            });
        });



    });


});


//--------------------------------------------------

app.post('/deleteproj', function (req, res) {

    Project.find({
        projectName: req.body.projectName
    }, function (err, projList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(projList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (projList.length != 0) {
            Project.findOneAndRemove({
                projectName: req.body.projectName
            }, function (err, projList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(projList);
                res.send({
                    "msg": "Record deleted for: " + req.body.projectName
                });

            });
        }
        else {
            res.send({
                "msg": "Record not found for: " + req.body.projectName
            });

        }

    });


});//projDelete ends

/* --------------------------------------------------------------- */

app.get('/getallprojs', function (req, res) {

    Project.find(function (err, user) {
        if (err) {
            res.send(err);
        }
        // console.log(user);//here we are getting an array of objects. Thanks Mongoose :)
        res.json(user);

    });


});
//getallprojs ends

/* --------------------------------------------------------------- */

//Manager related operations- creation of manager -- see all managers-- deletion of managers

/* --------------------------------------------------------------------------------- */

app.post('/insertmgr', function (req, res) {
    console.log(req.body);

    Manager.find({
        managerName: req.body.managerName
    }, function (err, mgrList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(mgrList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (mgrList.length != 0) {
            Manager.findOneAndRemove({
                managerName: req.body.managerName
            }, function (err, mgrList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(mgrList);
            });
        }

        //In any case Saving to MongoDB through Mongoose Object-Document-Mapping.--------
        var newManager = new Manager(req.body);
        newManager.save(function (err) {
            if (err) throw err;
            console.log('Manager saved successfully !!!!');
            res.send({
                "msg": "Record Updated for: " + req.body.managerName
            });
        });



    });


});


//--------------------------------------------------

app.post('/deletemgr', function (req, res) {
    console.log("-------***");
    console.log(req.body.managerName);
    Manager.find({
        managerName: req.body.managerName
    }, function (err, mgrList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(mgrList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (mgrList.length != 0) {
            Manager.findOneAndRemove({
                managerName: req.body.managerName
            }, function (err, mgrList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(mgrList);
                res.send({
                    "msg": "Record deleted for: " + req.body.managerName

                });

            });
        }
        else {
            res.send({
                "msg": "Record not found for: " + req.body.managerName
            });

        }

    });


});//mgrDelete ends

/* --------------------------------------------------------------- */

app.get('/getallmgrs', function (req, res) {

    Manager.find(function (err, user) {
        if (err) {
            res.send(err);
        }
        // console.log(user);//here we are getting an array of objects. Thanks Mongoose :)
        res.json(user);

    });


});
//getallmgrs ends

/* --------------------------------------------------------------- */

//Certification related operations- creation of certification -- see all cert -- deletion of certs

/* --------------------------------------------------------------------------------- */

app.post('/insertcert', function (req, res) {
    console.log(req.body);

    Certification.find({
        certificationName: req.body.certificationName
    }, function (err, certList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(certList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (certList.length != 0) {
            Certification.findOneAndRemove({
                certificationName: req.body.certificationName
            }, function (err, certList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(certList);
            });
        }

        //In any case Saving to MongoDB through Mongoose Object-Document-Mapping.--------
        var newCertification = new Certification(req.body);
        newCertification.save(function (err) {
            if (err) throw err;
            console.log('Certification saved successfully !!!!');
            res.send({
                "msg": "Record Updated for: " + req.body.certificationName
            });
        });



    });


});


//--------------------------------------------------

app.post('/deletecert', function (req, res) {
    console.log("-------***");
    console.log(req.body.certificationName);
    Certification.find({
        certificationName: req.body.certificationName
    }, function (err, certList) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        console.log(certList); //this is going to be an array of records. 
        //In case of zero recors, the array will be of size 0
        if (certList.length != 0) {
            Certification.findOneAndRemove({
                certificationName: req.body.certificationName
            }, function (err, certList) {
                if (err) { res.send(err); };
                console.log("Deleted--");
                console.log(certList);
                res.send({
                    "msg": "Record deleted for: " + req.body.certificationName

                });

            });
        }
        else {
            res.send({
                "msg": "Record not found for: " + req.body.certificationName
            });

        }

    });


});//certDelete ends

/* --------------------------------------------------------------- */

app.get('/getallcerts', function (req, res) {

    Certification.find(function (err, user) {
        if (err) {
            res.send(err);
        }
        // console.log(user);//here we are getting an array of objects. Thanks Mongoose :)
        res.json(user);

    });


});
//getallmgrs ends




/* --------------------------------------------------------------------------------- */


// Data coming in from excel:-

// empid : 1043616
// fullname : Mr. Mohammad Mansoor Khalid
// designation : XXXXX
// startdate : XXXXX
// enddate : XXXXX
// projectname : ADM
// location : Offshore
// experience : XXXXX
// manager : XXXXX
// comp_name : PDW Manager
// comp_exp : XXXXX
// comp_exp_1 : XXXXX
// comp_prac_exp : XXXXX
// comp_is_primary : Yes
// cert_name : XXXXX
// cert_acquired_date : XXXXX
// country : America