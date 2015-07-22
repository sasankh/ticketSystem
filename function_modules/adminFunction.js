var mongojs = require('mongojs');
var db = mongojs('test',['admins']);
var dbTeam = mongojs('test',['teams']);
var dbGlobal = mongojs('test',['globalSettings']);
var dbTicket = require('./ticketFunction');
var dbDirectory = require('./directoryFunction');
var bodyParser = require('body-parser');

//add new user to Directory
function addAdmin(req, res){
  req.body.show = true;
  req.body.ticketViewOptions = {creatorName:false, creationDate:false, level:false, ticketLocation:false, assignmentType:true, contactMethod:false};
  db.admins.insert(req.body,function(err, docs){
    res.json(200);
  });
}

//check user authentication
function adminAuthentication(gotUsername, gotPassword, callback){
  db.admins.count({username:gotUsername},function(err,doc){
    if(doc == 1){
      db.admins.findOne({username: gotUsername}, function(err,data){
        if(data.active){
          if(data.password === gotPassword){
            var userDate = {id: data._id, username: gotUsername};
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

//get username of admin
function getAdminUsername(id, callback){
  db.admins.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
    callback(doc.username);
  });
}

//get admin id
function getAdminID(user, callback){
  db.admins.findOne({username: user},{_id:1}, function(err, doc){
    callback(doc);
  });
}

//check user password
function changePassword(req, res){
  db.admins.findOne({_id: mongojs.ObjectId(req.user.id)}, function(err,doc){
    if(req.body.old == doc.password){
      db.admins.findAndModify({query: {_id: mongojs.ObjectId(req.user.id)}, update: {$set: {password : req.body.new}}, new: true}, function(err, docs){
        res.json(200);
      });
    }else{
      res.json(304);
    }
  });
}

//disable admin account
function disableAccount(req,res){
  db.admins.findAndModify({query: {_id: mongojs.ObjectId(req.user.id)}, update: {$set: {active : false}}, new: true}, function(err, docs){
    if(docs.active){
      res.json(304);
    }else{
      req.logout();
      res.json(200);
    }
  });
}

//get admin status
function adminStatus(req,res){
  var id = req.params.id;
  db.admins.findOne({directoryID:id}, function(err,doc){
    res.json(doc.active);
  });
}

//disable other admin account
function disableOtherAccount(req,res){
  var id = req.params.id;
  db.admins.findAndModify({query: {directoryID: id}, update: {$set: {active : false}}, new: true}, function(err, docs){
    if(docs.active){
      res.json(304);
    }else{
      res.json(200);
    }
  });
}

//activate other admin account
function activateOtherAccount(req,res){
  var id = req.params.id;
  db.admins.findAndModify({query: {directoryID: id}, update: {$set: {active : true}}, new: true}, function(err, docs){
    if(docs.active){
      res.json(200);
    }else{
      res.json(304);
    }
  });
}

//get ticket view options
function getticketViewOptions(req, res){
  db.admins.findOne({_id: mongojs.ObjectId(req.user.id)},{ticketViewOptions:1, _id:0}, function(err,doc){
    res.json(doc.ticketViewOptions);
  });
}

//set ticket view options
function setticketViewOptions(req, res){
  db.admins.findAndModify({query: {_id: mongojs.ObjectId(req.user.id)}, update: {$set: {ticketViewOptions : req.body.viewOptions}}, new: true}, function(err, docs){
    res.json(200);
  });
}

//get users for team
function getUsersForTeam(req,res){
  db.admins.find({active:true, show:true},{name:1, username:1, _id:0},function(err, docs){
    res.json(docs);
  });
}

//create team
function createTeam(req, res){
  req.body.creationDate = new Date();
  req.body.creator = req.user.username;
  req.body.active = true;
  dbTeam.teams.count({name:req.body.name}, function(err, docs){
    if(docs == 0){
      dbDirectory.checkUsernameExist(req.body.name,function(count){
        if(count == 0){
          dbTeam.teams.insert(req.body,function(err, doc){
            res.json(200);
          });
        }else{
          res.json("name");
        }
      });
    }else{
      res.json("name");
    }
  });
}

//get teamList
function getTeamList(req, res){
  dbTeam.teams.find().sort({name:1}, function(err, docs){
    res.json(docs);
  });
}

//get team information
function getTeamInfo(req, res){
  var id = req.params.id;
  dbTeam.teams.find({_id: mongojs.ObjectId(id)}, function(err, docs){
    res.json(docs[0]);
  });
}

//update Team information
function updateTeamInfo(req, res){
  var id = req.params.id;
  dbTeam.teams.findAndModify({query: {_id: mongojs.ObjectId(id)}, update: {$set: {description:req.body.description,  leads:req.body.leads, members:req.body.members}}, new: true}, function(err, docs){
    res.json(200);
  });
}

//activate team
function activateTeam(req, res){
  var id = req.params.id;
  dbTeam.teams.findAndModify({query: {_id: mongojs.ObjectId(id)}, update: {$set: {active:true}}, new: true}, function(err, docs){
    res.json(200);
  });
}

//disable team
function disableTeam(req, res){
  var id = req.params.id;
  console.log("team id");
  console.log(id);
  dbTeam.teams.findOne({_id: mongojs.ObjectId(id)},{name:1, _id:0}, function(err, docs){
    dbTicket.checkTeamTicketInternal(docs.name,function(activeTicket){
      if(activeTicket == 0){
        dbTeam.teams.findAndModify({query: {_id: mongojs.ObjectId(id)}, update: {$set: {active:false}}, new: true}, function(err, doc){
          res.json(200);
        });
      }else{
        res.json(304);
      }
    });
  });
}

//function user team
function getUserTeams(req,res){
  var members = [];
  var leads = [];
  dbTeam.teams.find({members:{$elemMatch:{username:req.user.username}}},{name:1, _id:0}, function(err, memberList){
    for(var x = 0; x < memberList.length; x++){
      members.push(memberList[x].name);
    }
    dbTeam.teams.find({leads:{$elemMatch:{username:req.user.username}}},{name:1, _id:0}, function(err, leadList){
      for(var x = 0; x < leadList.length; x++){
        leads.push(leadList[x].name);
      }
      var userAccess = {lead:leads,member:members};
      res.json(userAccess);
    });
  });
}

//get team members
function getTeamMembers(req, res){
  var team = req.params.team;
  if (team == 'OPEN'){
    db.admins.find({active:true},{username:1, name:1, _id:0}, function(err, activeAdmins){
      res.json(activeAdmins);
    });
  }else{
    dbTeam.teams.findOne({name:team, active:true},{_id:0, members:1}, function(err, teamList){
    res.json(teamList.members);
  });
}
}

//get team list for ticket transfer
function getTeamListForTransfer(req,res){
  dbTeam.teams.find({active:true},{name:1, _id:0}, function(err, teamList){
    res.json(teamList);
  });
}

//get team list for ticket
function teamListForTicket(req,res){
  var sendTeam = [];
  dbTeam.teams.find({active:true}, function(err, docs){
    for (var x = 0; x < docs.length;x++){
      var isLead = false;
      var members = [];
      var value = docs[x].name;
      var display = docs[x].name + " (Leads: ";
      for(var y = 0; y < docs[x].leads.length; y++){
        if(docs[x].leads[y].username == req.user.username){
          isLead = true;
          members = docs[x].members;
        }
        if(y == docs[x].leads.length-1){
          display = display + docs[x].leads[y].name + ")";
        }else{
          display = display + docs[x].leads[y].name + ", ";
        }
      }
      sendTeam[x] = {display:display, value:value, isLead:isLead, members:members};
    }
    res.json(sendTeam);
  });
}

//get the teams the user is in
function getUserTeamList(req, res){
  var userTeams = [];
  dbTeam.teams.find({active:true}, function(err, docs){
    for(var x = 0; x < docs.length; x++){
      if(docs[x].members.map(function(e) { return e.username; }).indexOf(req.user.username) > -1){        //imp to note
        userTeams.push(docs[x].name);
      }
    }
    res.json(userTeams);
  });
}
//global system options/settings
function setSystemTicketSettings(req, res){
  dbGlobal.globalSettings.findAndModify({query: {type : "systemTicketSettings"}, update: {$set: {ticketSettings : req.body.ticketSettings}}, new: true}, function(err, docs){
    res.json(200);
  });
}

function getSystemTicketSettings(req, res){
  dbGlobal.globalSettings.findOne({type:"systemTicketSettings"},{ticketSettings:1, _id:0}, function(err, docs){
    res.json(docs);
  });
}





module.exports.getAdminUsername = getAdminUsername;
module.exports.addAdmin = addAdmin;
module.exports.adminAuthentication = adminAuthentication;
module.exports.changePassword = changePassword;
module.exports.disableAccount = disableAccount;
module.exports.adminStatus = adminStatus;
module.exports.disableOtherAccount = disableOtherAccount;
module.exports.activateOtherAccount = activateOtherAccount;
module.exports.getUsersForTeam = getUsersForTeam;
module.exports.createTeam = createTeam;
module.exports.getTeamList = getTeamList;
module.exports.getTeamInfo = getTeamInfo;
module.exports.updateTeamInfo = updateTeamInfo;
module.exports.activateTeam = activateTeam;
module.exports.disableTeam = disableTeam;
module.exports.teamListForTicket = teamListForTicket;
module.exports.getAdminID = getAdminID;
module.exports.getUserTeams = getUserTeams;
module.exports.getTeamMembers = getTeamMembers;
module.exports.getticketViewOptions = getticketViewOptions;
module.exports.setticketViewOptions = setticketViewOptions;
module.exports.getTeamListForTransfer = getTeamListForTransfer;
module.exports.setSystemTicketSettings = setSystemTicketSettings;
module.exports.getSystemTicketSettings = getSystemTicketSettings;
module.exports.getUserTeamList = getUserTeamList;
