var mongojs = require('mongojs');
var db = mongojs('test',['Ticket']);
var bodyParser = require('body-parser');
var sendEmails = require('./sendEmails');
var dbDirectory = require('./directoryFunction');
var dbAdmin = require('./adminFunction');
var socketConnect = require('./socketFunction');
//being scrapped var tRFunction = require('./ticketRelationFunctions')

//Database interactions functions for Ticket Collection

//check is there is any related tickets to the user
function checkTicketExsistance(id, callback){
  db.Ticket.count({_id: mongojs.ObjectId(id)},function(err,doc){
    callback(doc);
  });
}

//check is there is any related tickets to the user
function checkUserTickets(req,res){
  var id = req.params.id;
  db.Ticket.count({customerID:id},function(err,doc){
    res.json(doc);
  });
}

//check is there is any related tickets to team
function checkTeamTicketInternal(teamName,callback){
  db.Ticket.count({assignedTeam:teamName, active:true},function(err,doc){
    callback(doc);
  });
}

//add new ticket
function addNewTicket(req, res){
  req.body.creationDate = new Date();
  req.body.creatorID = req.user.id;
  req.body.creatorName = req.user.username;
  req.body.closerID = 'NONE';
  req.body.closerName = 'NONE';
  req.body.closedDate = "";
  req.body.active = true;

  if(req.body.assignmentType == 'SELF'){
    req.body.assignTo = 'NONE';
    req.body.holderName = req.user.username;
    req.body.holderID = req.user.id;
    req.body.ticketState = 'In Progress';
    if(req.body.assignedTeam === 'SELF'){
      req.body.assignedTeam = 'OPEN';
    }
    req.body.assignmentType = 'OPEN';
    enterTheTicket(req,function(reply){
      res.json(reply);
      socketConnect.sendRefresh();
    });
  }else if(req.body.assignmentType == 'DIRECT ASSIGNMENT'){
    if(req.body.assignTo == req.user.username){
      req.body.holderName = req.user.username;
      req.body.holderID = req.user.id;
      req.body.ticketState = 'In Progress';
      req.body.assignTo = 'NONE';
    }else{
      req.body.holderName = 'OPEN';
      req.body.holderID = 'OPEN';
      req.body.ticketState = 'To be acknowledged';
    }
    enterTheTicket(req,function(reply){
      res.json(reply);
      socketConnect.sendRefresh();
    });
    }else if(req.body.assignmentType == 'LEAD ASSIGNED'){
      req.body.assignTo = 'NONE';
      req.body.holderName = 'OPEN';
      req.body.holderID = 'OPEN';
      req.body.ticketState = 'To Be Assigned';
      enterTheTicket(req,function(reply){
        res.json(reply);
        socketConnect.sendRefresh();
      });
    }else{
      req.body.holderName = 'OPEN';
      req.body.holderID = 'OPEN';
      req.body.ticketState = 'New';
      req.body.assignTo = 'NONE';
      enterTheTicket(req,function(reply){
        res.json(reply);
        socketConnect.sendRefresh();
      });
    }
  }
/*  //coede for the creation of worklog creation content
  var logContent = "Customer: " + req.body.customerName + ", Prefered Contact Method: " + req.body.contactMethod + ", Assigned to team: "+req.body.assignedTeam+", Level: "+req.body.level+", Ticket Holder: "+req.body.holderName+", Ticket Type: "+
  req.body.type+ ", Priority: " + req.body.priority + ", Ticket Location: "+req.body.ticketLocation+", Short Description: "+ req.body.shortDescription+ ", Detail Description: "+req.body.detailDescription+", Notify ticket creation to customer: "+req.body.customerNotifyCreation;
  req.body.workLog = [{type:"creation", date: new Date(), by:req.user.username, content:logContent, customerNotifyLog: req.body.customerNotifyCreation, customerVisibleLog:false}];

  db.Ticket.insert(req.body,function(err, docs){
    if(req.body.customerNotifyCreation === true){
      dbDirectory.getUserEmailInternal(req.body.customerID,function(customerInfo){
        var emailObject = {"ticketID":docs._id,"title": docs.ticketTitle,"email": customerInfo.email};
        sendEmails.emailConformation(emailObject);
      });
    }
    res.json(docs);
  });*/


//enter the new ticket
function enterTheTicket(req,callback){
  //coede for the creation of worklog creation content
  var logContent = "Customer: " + req.body.customerName + ", Prefered Contact Method: " + req.body.contactMethod + ", Assigned to team: "+req.body.assignedTeam+", Level: "+req.body.level+", Ticket Holder: "+req.body.holderName+", Ticket Type: "+
  req.body.type+ ", Priority: " + req.body.priority + ", Ticket Location: "+req.body.ticketLocation+", Short Description: "+ req.body.shortDescription+ ", Detail Description: "+req.body.detailDescription+", Notify ticket creation to customer: "+req.body.customerNotifyCreation;
  req.body.workLog = [{type:"creation", date: new Date(), by:req.user.username, content:logContent, customerNotifyLog: req.body.customerNotifyCreation, customerVisibleLog:false}];

  db.Ticket.insert(req.body,function(err, docs){
    if(req.body.customerNotifyCreation === true){
      dbDirectory.getUserEmailInternal(req.body.customerID,function(customerInfo){
        var emailObject = {"ticketID":docs._id,"title": docs.ticketTitle,"email": customerInfo.email};
        sendEmails.emailConformation(emailObject);
      });
    }
    callback(docs);
  });
}

//assign ticket to user
function assignTicketToUser(req, res){
  var id = req.params.id;
//  dbAdmin.getAdminID(req.body.holderName,function(hID){
  if(req.body.type == 'assign'){
    req.body.ticketState = 'To be acknowledged';
    req.body.assignmentType = 'DIRECT ASSIGNMENT';
  }else if(req.body.type == 'team' || req.body.type == 'transfer'){
    req.body.ticketState = 'To be acknowledged';
  }else{
    req.body.ticketState = 'To be approved';
  }
    db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {assignTo: req.body.assignTo, ticketState: req.body.ticketState, assignmentType:req.body.assignmentType}},new: true}, function(err, doc){
      if(req.body.type == 'assign'){
        var assignedContent = "Ticket assigned to user: " + req.body.assignTo;
        var log = {type:"Assigned", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
      }else if(req.body.type == 'transfer'){
        var assignedContent = "Transfer requested to user: " + req.body.assignTo + " with comment -- " + req.body.comment + " --";
        var log = {type:"Transfer Request", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
      }else if(req.body.type == 'teamTransfer'){
        var assignedContent = "Transfer requested to team: " + req.body.assignTo + " with comment -- " + req.body.comment + " --";
        var log = {type:"Transfer Request", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
      }else{
        var assignedContent = "Transfer suggested to user: " + req.body.assignTo + " with comment -- " + req.body.comment + " --";
        var log = {type:"Transfer Suggestion", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
      }
      enterLog(id,log, function(){});
      res.json(200);
      socketConnect.sendRefresh();
    });
//  });
}

//approve ticket transfer
function approveTransfer(req, res){
  var id = req.params.id;
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {ticketState: 'To be acknowledged'}},new: true}, function(err, doc){
    var assignedContent = "Transfer approved to user: " + req.body.transferTo;
    var log = {type:"Approved", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
    enterLog(id,log, function(){});
    res.json(200);
    socketConnect.sendRefresh();
  });
}

//acknowledge ticket
function acknowledgeTicket(req, res){
  var id = req.params.id;
  var log = {type:"Acknowledgement", date: new Date(), by:req.user.username, content:"Ticket assignment acknowledged by user: "+req.user.username, customerNotifyLog:false, customerVisibleLog:false};
  enterLog(id,log, function(){});
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {ticketState: "In Progress", holderName:req.user.username, holderID:req.user.id, assignTo:"NONE"}},new: true}, function(err, doc){
    res.json(200);
    socketConnect.sendRefresh();
  });
}

//send the list of all active tickets
function listTicket(req, res){
  db.Ticket.find({active: true},{creatorName:1, assignTo:1, assignmentType:1, assignedTeam:1, ticketTitle:1, priority:1, dDate:1, customerID:1, ticketState:1, customerName:1, holderName:1, creationDate:1, ticketLocation:1, contactMethod:1, level:1},function(err, lists){
    res.json(lists);
  });
}

//list disable ticket
function listDisableTicket(req, res){
  db.Ticket.find({active: false},{closedDate:1 ,closerName:1, creatorName:1, assignTo:1, assignmentType:1, assignedTeam:1, ticketTitle:1, priority:1, dDate:1, shortDescription:1, customerID:1, ticketState:1, customerName:1, holderName:1, creationDate:1, ticketLocation:1, contactMethod:1, level:1},function(err, lists){
    res.json(lists);
  });
}

//acknowledge team transfer
function acknowledgeTeamTransfer(req, res){
  var id = req.params.id;
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {ticketState: "To Be Assigned", holderName:'OPEN', holderID:'OPEN', assignTo:"NONE", assignmentType:"LEAD ASSIGNED", assignedTeam:req.body.assignTo}},new: true}, function(err, doc){
    var log = {type:"Acknowledgement", date: new Date(), by:req.user.username, content:"Ticket transfer to " + req.body.assignTo + " acknowledged by lead: "+req.user.username, customerNotifyLog:false, customerVisibleLog:false};
    enterLog(id,log, function(){});
    res.json(200);
    socketConnect.sendRefresh();
  });
}

//get Ticket info
function obtainTicketInfo(req, res){
  var id = req.params.id;
  db.Ticket.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
    res.json(doc);
  });
}

//update ticket info
//update user info
function updateTicketInfo(req, res){
  var id = req.params.id;
 findModifications(req.body,id,function(modifications){
   var log = {type:"Modification", date: new Date(), by:req.user.username, content:modifications, customerNotifyLog:false, customerVisibleLog:false};
   enterLog(id,log, function(){});
 });
  //main update part
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},
    update: {$set: {customerID : req.body.customerID, customerName : req.body.customerName, contactMethod : req.body.contactMethod, assignedTeam : req.body.assignedTeam, level : req.body.level, ticketTitle : req.body.ticketTitle, type : req.body.type, priority : req.body.priority, ticketLocation : req.body.ticketLocation, shortDescription : req.body.shortDescription, detailDescription : req.body.detailDescription, holderName : req.body.holderName
  }},
    new: true}, function(err, doc){
    res.json(200);
    socketConnect.sendRefresh();
  });
}

//grab ticket
function grabTicket(req, res){
  var id = req.params.id;
  var log = {type:"Grabbed", date: new Date(), by:req.user.username, content:"Ticket grabbed by user: "+req.user.username, customerNotifyLog:false, customerVisibleLog:false};
  enterLog(id,log, function(){});
  db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},
    update: {$set: {holderName: req.user.username, holderID: req.user.id, ticketState: "In Progress", assignTo:'NONE'}},
    new: true}, function(err, doc){
    res.json(200);
    socketConnect.sendRefresh();
  });
}


//add log to a ticket
/*---1----
function addTicketLog(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.body.by, content:req.body.content};
  db.Ticket.update({_id: mongojs.ObjectId(id)},{$push:{workLog:log}},function(err,doc){
    res.json(doc);
  });
}
*/
function addTicketLog(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.user.username, content:req.body.content, customerNotifyLog:req.body.customerNotifyLog, customerVisibleLog:req.body.customerVisibleLog};
  enterLog(id,log, function(doc){
    if(doc.ok){
      if(req.body.customerNotifyLog){
        dbDirectory.getUserEmailInternal(req.body.customerID, function(customerInfo){
          var emailData = {"by":req.user.username, "kind":"Internal","to":customerInfo.email, "subject":"Update regarding ticket: SYSTICKET"+id+"ENDTICKET","message":req.body.content, "ticketID":id};
          sendEmails.notifyEmail(emailData, function(){
            res.json(200);
          });
        });
      }else{
        res.json(200);
      }
    }else{
      res.json(300);
    }
  });
}

//deny transfer
function denyTransfer(req, res){
  var id = req.params.id;
  db.Ticket.findOne({_id: mongojs.ObjectId(id)}, {assignTo:1, ticketState:1, _id:0}, function(err, doc){
    if((doc.assignTo != 'NONE') && (doc.ticketState == 'To be approved')){
      db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {ticketState: "In Progress", assignTo:"NONE"}},new: true}, function(err, doc){
        var assignedContent = "Deny of transfer request to "+req.body.denyTo;
        var log = {type:"Transfer Request Denied", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
        enterLog(id,log, function(){});
        res.json(200);
        socketConnect.sendRefresh();
      });
    }else{
      res.json(300);
      socketConnect.sendRefresh();
    }
  })
}

//cancel transfer request
function cancelTransferRequest(req, res){
  var id = req.params.id;
  var assignTicketState = "In Progress";
  db.Ticket.findOne({_id: mongojs.ObjectId(id)}, {holderName:1, assignTo:1, ticketState:1, _id:0}, function(err, doc){
    if((doc.holderName == 'OPEN') && (doc.assignedTeam != 'OPEN')){
      assignTicketState = "To Be Assigned";
    }
    if((doc.assignTo != 'NONE') && ((doc.ticketState == 'To be acknowledged') || (doc.ticketState == 'To be approved'))){
      db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)},update: {$set: {ticketState: assignTicketState, assignTo:"NONE"}},new: true}, function(err, doc){
        var assignedContent = "Cancelation of transfer request to "+req.body.assignTo;
        var log = {type:"Transfered Requested Canceled", date: new Date(), by:req.user.username, content:assignedContent, customerNotifyLog:false, customerVisibleLog:false};
        enterLog(id,log, function(){});
        res.json(200);
        socketConnect.sendRefresh();
      });
    }else{
      res.json(300);
      socketConnect.sendRefresh();
    }
  })
}

//close ticket
function closeTicket(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.user.username, content:req.body.content, customerNotifyLog:req.body.customerNotifyLog, customerVisibleLog:req.body.customerVisibleLog};
  enterLog(id,log, function(doc){
    if(doc.ok){
      db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)}, update: {$set: {closerID: req.user.id, closerName: req.user.username, closedDate: new Date() , ticketState: req.body.ticketState, active:false}}, new: true}, function(err, doc){
        if(req.body.customerNotifyLog){
          dbDirectory.getUserEmailInternal(req.body.customerID, function(customerInfo){
            var emailData = {"by":req.user.username, "kind":"Closing","to":customerInfo.email, "subject":"Ticket: SYSTICKET"+id+"ENDTICKET " + req.body.ticketState,"message":"This is to let you know that the ticket (SYSTICKET"+id+"ENDTICKET) has been " + req.body.ticketState + " and closed with the closing comment: ---"+req.body.content+" ---. Thank You.", "ticketID":id};
            sendEmails.notifyEmail(emailData, function(){
              res.json(200);
              socketConnect.sendRefresh();
            });
          });
        }else{
          res.json(200);
          socketConnect.sendRefresh();
        }
      });
    }else{
      res.json(300);
      socketConnect.sendRefresh();
    }
  });
}


//activate ticket
function activateTicket(req, res){
  var id = req.params.id;
  var log = {type:req.body.type, date: new Date(), by:req.user.username, content:req.body.content, customerNotifyLog:req.body.customerNotifyLog, customerVisibleLog:req.body.customerVisibleLog};
  enterLog(id,log, function(doc){
    if(doc.ok){
      db.Ticket.findAndModify({query: {_id: mongojs.ObjectId(id)}, update: {$set: {assignTo:'NONE', assignedTeam:'OPEN', assignmentType:'OPEN', closerID: 'NONE', closerName: 'NONE', closedDate:"NONE" ,ticketState: 'In Progress', active:true, holderName:req.user.username, holderID:req.user.id}}, new: true}, function(err, doc){
        if(req.body.customerNotifyLog){
          dbDirectory.getUserEmailInternal(req.body.customerID, function(customerInfo){
            var emailData = {"by":req.user.username, "kind":"Ticket Reactivation","to":customerInfo.email, "subject":"Ticket: SYSTICKET"+id+"ENDTICKET Reactivated" + req.body.reason,"message":"This is to let you know that the ticket (SYSTICKET"+id+"ENDTICKET) has been reactivated with the following comment: ---"+req.body.content+" ---. Thank You.", "ticketID":id};
            sendEmails.notifyEmail(emailData, function(){
              res.json(200);
              socketConnect.sendRefresh();
            });
          });
        }else{
          res.json(200);
          socketConnect.sendRefresh();
        }
      });
    }else{
      res.json(300);
      socketConnect.sendRefresh();
    }
  });
}




//export function
module.exports.addNewTicket = addNewTicket;
module.exports.checkUserTickets = checkUserTickets;
module.exports.listTicket = listTicket;
module.exports.obtainTicketInfo = obtainTicketInfo;
module.exports.updateTicketInfo = updateTicketInfo;
module.exports.addTicketLog = addTicketLog;
module.exports.enterLog = enterLog;
module.exports.checkTicketExsistance = checkTicketExsistance;
module.exports.grabTicket = grabTicket;
module.exports.checkTeamTicketInternal = checkTeamTicketInternal;
module.exports.acknowledgeTicket = acknowledgeTicket;
module.exports.assignTicketToUser = assignTicketToUser;
module.exports.closeTicket = closeTicket;
module.exports.approveTransfer = approveTransfer;
module.exports.acknowledgeTeamTransfer = acknowledgeTeamTransfer;
module.exports.cancelTransferRequest = cancelTransferRequest;
module.exports.activateTicket = activateTicket;
module.exports.listDisableTicket = listDisableTicket;
module.exports.denyTransfer = denyTransfer;

//internal function
//enter in the log
function enterLog(id, log, callback){
  db.Ticket.update({_id: mongojs.ObjectId(id)},{$push:{workLog:log}},function(err,doc){
    callback({ok:true});
  });
}

//find the difference of ticket detail modification
function findModifications(newData,ticketID,callback){
  var modifications = "";
  var topic = "";
  db.Ticket.findOne({_id: mongojs.ObjectId(ticketID)},{contactMethod:1, ticketLocation:1, type:1, assignedTeam:1, level:1, ticketTitle:1, priority:1, dDate:1, shortDescription:1, customerName:1, detailDescription:1, assignmentType:1}, function(err, doc){
    for (attribute in doc){
      if(doc[attribute] != newData[attribute]){
        switch(attribute){
          case "contactMethod":
            topic = "Prefered Customer Contact Method";
            break;
          case "ticketLocation":
            topic = "Ticket Location";
            break;
          case "type":
            topic = "Ticket Type";
            break;
          case "assignedTeam":
            topic = "Assigned Team";
            break;
          case "level":
            topic = "Level";
            break;
          case "ticketTitle":
            topic = "Ticket Title";
            break;
          case "priority":
            topic = "Priority";
            break;
          case "dDate":
            topic = "Due Date";
            break;
          case "shortDescription":
            topic = "Short Description";
            break;
          case "customerName":
            topic = "Customer";
            break;
          case "detailDescription":
            topic = "Detail Description";
            break;
          case "assignmentType":
            topic = "Assignment Type";
            break;
          default:
            topic = "";
        }
        if(attribute == "priority"){
          var oldValue = "";
          var newValue = "";
          switch(doc[attribute]){
            case "1":
              oldValue = "Urgent";
              break;
            case "2":
              oldValue = "High";
              break;
            case "3":
              oldValue = "Medium";
              break;
            case "4":
              oldValue = "Low";
              break;
            default:
          }
          switch(newData[attribute]){
            case "1":
              newValue = "Urgent";
              break;
            case "2":
              newValue = "High";
              break;
            case "3":
              newValue = "Medium";
              break;
            case "4":
              newValue = "Low";
              break;
            default:
          }
          modifications = modifications + topic + ": " + oldValue + " => " + newValue + ", ";
        }else{
          modifications = modifications + topic + ": " + doc[attribute] + " => " + newData[attribute] + ", ";
        }
        topic = "";
      }
    }
    callback(modifications);
  });
}
