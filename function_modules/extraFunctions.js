var mongojs = require('mongojs');
var bodyParser = require('body-parser');

//add new user to Directory
function addNewGroup(req, res){
  var db = mongojs('test',['group']);
  db.group.insert(req.body,function(err, docs){
    res.json(docs);
  });
}

//add new user to Directory
function listGroups(req, res){
  var db = mongojs('test',['group']);
  db.group.find().sort({name:1}, function(err, docs){
    res.json(docs);
  });
}



//exports functions
module.exports.addNewGroup = addNewGroup;
module.exports.listGroups = listGroups;
