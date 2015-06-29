var mongojs = require('mongojs');
var db = mongojs('test',['admins']);
var bodyParser = require('body-parser');

//add new user to Directory
function addAdmin(req, res){
  db.admins.insert(req.body,function(err, docs){
    res.json(docs);
  });
}

//check user authentication
function adminAuthentication(gotUsername, gotPassword, callback){
  db.admins.count({username:gotUsername},function(err,doc){
    if(doc == 1){
      db.admins.findOne({username: gotUsername}, function(err,data){
        if(data.active){
          if(data.password === gotPassword){
            var userDate = {id: gotUsername, name: gotUsername};
            callback(userDate);
          }else{
            callback(null);
          }
        }else{
          callback(null);
        }
      });
    }else{
      callback(null);
    }
  });
};

module.exports.addAdmin = addAdmin;
module.exports.adminAuthentication = adminAuthentication;
