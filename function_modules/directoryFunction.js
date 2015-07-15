var mongojs = require('mongojs');
var db = mongojs('test',['Directory']);
var bodyParser = require('body-parser');


//Database interactions functions for Directory Collection

//List the Content in the Library

function listDirectory(req, res){
  db.Directory.find().sort({fname:1}, function(err, docs){
    res.json(docs);
  });
}

//add new user to Directory
function addDirectory(req, res){
  //check and add user
  db.Directory.count({username: req.body.username}, function(err, checkUser){
    if(checkUser == 0){
      db.Directory.count({NUID: req.body.NUID}, function(err, checkNUID){
        if(checkNUID == 0){
          db.Directory.count({email: req.body.email}, function(err, checkEmail){
            if(checkEmail == 0){
              db.Directory.insert(req.body,function(err, docs){
                res.json(200);
              });
            }else{
              res.json("Email");
            }
          });
        }else{
          res.json("NUID");
        }
      });
    }else{
      res.json("username");
    }
  });
/*
  db.Directory.insert(req.body,function(err, docs){
    res.json(200);
  });*/
}

//remove user from Directory
function removeFromDirectory(req, res){
  var id = req.params.id;
  db.Directory.remove({_id: mongojs.ObjectId(id)}, function (err, doc){
    res.json(doc);
  });
}


//get user info
function obtainUserInfo(req, res){
  var id = req.params.id;
  db.Directory.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
    res.json(doc);
  });
}

//get directory id
function getdirectoryID(req, res){
  var userName = req.params.username;
  db.Directory.findOne({username: userName}, function(err, doc){
    res.json(doc._id);
  });
}

//update user info
function updateUserInfo(req, res){
  var id = req.params.id;
  //main update part
  db.Directory.findAndModify({query: {_id: mongojs.ObjectId(id)},
    update: {$set: {group : req.body.group, NUID : req.body.NUID, username : req.body.username, fname : req.body.fname, lname : req.body.lname, title : req.body.title, email : req.body.email, number : req.body.number, departmentname : req.body.departmentname, location : req.body.location, bName : req.body.bName, college : req.body.college, note : req.body.note
  }},
    new: true}, function(err, doc){
    res.json(doc);
  });
}

//typeahead directory functions

//typeahead for customer/user function
function lookCustomers(req, res){
  var look = req.params.look;
  db.Directory.find({$or: [{fname: {$regex: look, $options: 'i'}}, {lname: {$regex: look, $options: 'i'}},{email: {$regex: look, $options: 'i'}}]},{fname: 1, lname:1, email:1, _id:1}, function(err, doc){
    res.json(doc);
  });
}

//simple info functions
//return user email external based on id received
function getUserEmail(req, res){
  var id = req.params.id;
  db.Directory.findOne({_id: mongojs.ObjectId(id)},{email:1}, function(err, doc){
    res.json(doc);
  });
}

//return user email internally
function getUserEmailInternal(id, callback){
  db.Directory.findOne({_id: mongojs.ObjectId(id)},{email:1}, function(err, email){
    callback(email);
  });
}

//get user name
function getUserName(id, cb){
  db.Directory.findOne({_id: mongojs.ObjectId(id)},{fname:1, lname:1}, function(err, doc){
    cb(doc);
  });
}

//check if same username
function checkUsernameExist(name, callback){
  db.Directory.count({username: name}, function(err, checkUser){
    callback(checkUser);
  });
}

//Exports Functions
//regular directory function export
module.exports.listDirectory = listDirectory;
module.exports.addDirectory = addDirectory;
module.exports.removeFromDirectory = removeFromDirectory;
module.exports.obtainUserInfo = obtainUserInfo;
module.exports.updateUserInfo = updateUserInfo;
module.exports.getdirectoryID = getdirectoryID;
module.exports.checkUsernameExist = checkUsernameExist;

//typeahead export
module.exports.lookCustomers = lookCustomers;

//id export
module.exports.getUserEmail = getUserEmail;
module.exports.getUserName = getUserName;
module.exports.getUserEmailInternal = getUserEmailInternal;
